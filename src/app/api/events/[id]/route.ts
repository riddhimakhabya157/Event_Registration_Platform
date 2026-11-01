import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        _count: {
          select: {
            registrations: {
              where: { status: "CONFIRMED" },
            },
          },
        },
      },
    });

    if (!event) {
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

    const confirmedCount = event._count.registrations;
    const remainingSeats = Math.max(0, event.capacity - confirmedCount);
    let status: "OPEN" | "ALMOST_FULL" | "FULL" = "OPEN";

    if (remainingSeats === 0) {
      status = "FULL";
    } else if (remainingSeats <= Math.ceil(event.capacity * 0.25)) {
      status = "ALMOST_FULL";
    }

    // Also fetch available domain interests so frontend doesn't hardcode them
    const domainInterests = await prisma.domainInterest.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        scheduledAt: event.scheduledAt.toISOString(),
        venue: event.venue,
        capacity: event.capacity,
        confirmedCount,
        remainingSeats,
        status,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        domainInterests: domainInterests.map((di) => di.name),
      },
    });
  } catch (error) {
    console.error("Failed to fetch event details:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve event details.",
        },
      },
      { status: 500 }
    );
  }
}
