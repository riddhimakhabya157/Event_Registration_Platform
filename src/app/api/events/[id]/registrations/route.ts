import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registrationSchema, normalizeEmail } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventParam } = params;

    // 1. Parse and validate JSON request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_JSON",
            message: "Request body must be a valid JSON object.",
          },
        },
        { status: 400 }
      );
    }

    const validationResult = registrationSchema.safeParse(body);
    if (!validationResult.success) {
      const firstErrorMessage =
        validationResult.error.errors[0]?.message || "Invalid registration data.";
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: firstErrorMessage,
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { fullName, email, collegeOrOrganization, interests } =
      validationResult.data;

    // 2. Normalize participant email
    const emailNormalized = normalizeEmail(email);

    // 3. Execute registration in a database transaction to prevent race conditions and oversubscription
    const result = await prisma.$transaction(async (tx) => {
      // Confirm that the event exists
      const event = await tx.event.findFirst({
        where: {
          OR: [{ id: eventParam }, { slug: eventParam }],
        },
      });

      if (!event) {
        const error = new Error("EVENT_NOT_FOUND");
        (error as unknown as { code: string }).code = "EVENT_NOT_FOUND";
        throw error;
      }

      // Check current confirmed capacity
      const confirmedCount = await tx.registration.count({
        where: {
          eventId: event.id,
          status: "CONFIRMED",
        },
      });

      if (confirmedCount >= event.capacity) {
        const error = new Error("CAPACITY_EXCEEDED");
        (error as unknown as { code: string }).code = "CAPACITY_EXCEEDED";
        throw error;
      }

      // Fetch or map domain interest records
      const domainRecords = await tx.domainInterest.findMany({
        where: {
          name: { in: interests },
        },
      });

      if (domainRecords.length !== interests.length) {
        const error = new Error("INVALID_INTERESTS");
        (error as unknown as { code: string }).code = "INVALID_INTERESTS";
        throw error;
      }

      // Create Registration (database unique constraint [eventId, emailNormalized] will catch duplicates)
      const registration = await tx.registration.create({
        data: {
          eventId: event.id,
          fullName,
          email,
          emailNormalized,
          collegeOrOrganization,
          status: "CONFIRMED",
        },
      });

      // Associate domain interests in join table
      await tx.registrationInterest.createMany({
        data: domainRecords.map((dr) => ({
          registrationId: registration.id,
          domainInterestId: dr.id,
        })),
      });

      const updatedCount = confirmedCount + 1;
      const remainingSeats = Math.max(0, event.capacity - updatedCount);

      return {
        registration: {
          id: registration.id,
          fullName: registration.fullName,
          email: registration.email,
          collegeOrOrganization: registration.collegeOrOrganization,
          status: registration.status,
          createdAt: registration.createdAt.toISOString(),
          interests,
        },
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          capacity: event.capacity,
          confirmedCount: updatedCount,
          remainingSeats,
        },
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Check for Prisma composite unique constraint violation (P2002)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_REGISTRATION",
            message: "This email is already registered for this event.",
          },
        },
        { status: 409 }
      );
    }

    const customError = error as { code?: string; message?: string };

    if (customError.code === "EVENT_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EVENT_NOT_FOUND",
            message: "The requested event could not be found.",
          },
        },
        { status: 404 }
      );
    }

    if (customError.code === "CAPACITY_EXCEEDED") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CAPACITY_EXCEEDED",
            message: "Registration failed. This event has reached full capacity.",
          },
        },
        { status: 409 }
      );
    }

    if (customError.code === "INVALID_INTERESTS") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INTERESTS",
            message: "One or more selected domain interests are invalid.",
          },
        },
        { status: 400 }
      );
    }

    console.error("Unexpected registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while processing registration.",
        },
      },
      { status: 500 }
    );
  }
}
