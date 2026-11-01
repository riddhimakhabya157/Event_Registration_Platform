import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id } = params;
    const body = await req.json();
    const { status } = body || {};

    if (!status || !["CONFIRMED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "Status must be either 'CONFIRMED' or 'CANCELLED'.",
          },
        },
        { status: 400 }
      );
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating registration status:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update registration status.",
        },
      },
      { status: 500 }
    );
  }
}
