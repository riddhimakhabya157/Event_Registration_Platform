import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1. Authenticate request
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Access denied. Valid admin session is required.",
        },
      },
      { status: 401 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";
    const eventId = searchParams.get("eventId")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const sort = searchParams.get("sort") || "createdAt_desc";

    // Build filter conditions
    const whereConditions: Prisma.RegistrationWhereInput = {};

    if (eventId && eventId !== "ALL") {
      whereConditions.eventId = eventId;
    }

    if (status && status !== "ALL") {
      whereConditions.status = status;
    }

    if (search) {
      whereConditions.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { collegeOrOrganization: { contains: search } },
        { event: { title: { contains: search } } },
      ];
    }

    // Determine sorting
    let orderBy: Prisma.RegistrationOrderByWithRelationInput = {
      createdAt: "desc",
    };

    if (sort === "createdAt_asc") {
      orderBy = { createdAt: "asc" };
    } else if (sort === "name_asc") {
      orderBy = { fullName: "asc" };
    } else if (sort === "name_desc") {
      orderBy = { fullName: "desc" };
    }

    const registrations = await prisma.registration.findMany({
      where: whereConditions,
      orderBy,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        interests: {
          include: {
            domainInterest: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const formattedAttendees = registrations.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      eventTitle: r.event.title,
      eventSlug: r.event.slug,
      fullName: r.fullName,
      email: r.email,
      collegeOrOrganization: r.collegeOrOrganization,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      interests: r.interests.map((i) => i.domainInterest.name),
    }));

    return NextResponse.json({
      success: true,
      data: formattedAttendees,
    });
  } catch (error) {
    console.error("Error retrieving admin attendees:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load attendees list.",
        },
      },
      { status: 500 }
    );
  }
}
