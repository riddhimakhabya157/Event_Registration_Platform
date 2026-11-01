import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth";

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

  return NextResponse.json({
    success: true,
    data: {
      username: session.username,
      role: session.role,
    },
  });
}
