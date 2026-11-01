import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { scheduledAt: "asc" },
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

    const formattedEvents = events.map((event) => {
      const confirmedCount = event._count.registrations;
      const remainingSeats = Math.max(0, event.capacity - confirmedCount);
      let status: "OPEN" | "ALMOST_FULL" | "FULL" = "OPEN";

      if (remainingSeats === 0) {
        status = "FULL";
      } else if (remainingSeats <= Math.ceil(event.capacity * 0.25)) {
        status = "ALMOST_FULL";
      }

      return {
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
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedEvents,
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve events. Please try again later.",
        },
      },
      { status: 500 }
    );
  }
}
