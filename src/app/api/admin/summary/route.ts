import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Admin authentication required.",
        },
      },
      { status: 401 }
    );
  }

  try {
    const [events, totalRegistrations, confirmedRegistrations, cancelledRegistrations] =
      await Promise.all([
        prisma.event.findMany({
          include: {
            _count: {
              select: {
                registrations: {
                  where: { status: "CONFIRMED" },
                },
              },
            },
          },
        }),
        prisma.registration.count(),
        prisma.registration.count({ where: { status: "CONFIRMED" } }),
        prisma.registration.count({ where: { status: "CANCELLED" } }),
      ]);

    const totalEvents = events.length;
    const totalCapacity = events.reduce((acc, curr) => acc + curr.capacity, 0);
    const totalRemainingSeats = events.reduce(
      (acc, curr) => acc + Math.max(0, curr.capacity - curr._count.registrations),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        totalEvents,
        totalRegistrations,
        confirmedRegistrations,
        cancelledRegistrations,
        totalCapacity,
        totalRemainingSeats,
      },
    });
  } catch (error) {
    console.error("Error retrieving admin summary:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load admin summary metrics.",
        },
      },
      { status: 500 }
    );
  }
}
