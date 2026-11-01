import { NextRequest, NextResponse } from "next/server";
import { signAdminToken, getAdminCredentials, SESSION_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_CREDENTIALS",
            message: "Username and password are required.",
          },
        },
        { status: 400 }
      );
    }

    const creds = getAdminCredentials();
    if (username !== creds.username || password !== creds.password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid admin username or password.",
          },
        },
        { status: 401 }
      );
    }

    const token = signAdminToken(username);

    const response = NextResponse.json({
      success: true,
      data: {
        username,
        message: "Admin authentication successful.",
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error during login.",
        },
      },
      { status: 500 }
    );
  }
}
