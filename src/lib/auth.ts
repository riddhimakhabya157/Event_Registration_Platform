import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || "fallback-secret-for-dev-environments-only-32char";

export interface AdminSessionPayload {
  username: string;
  role: "admin";
  iat?: number;
  exp?: number;
}

export function signAdminToken(username: string): string {
  return jwt.sign(
    { username, role: "admin" } satisfies AdminSessionPayload,
    SESSION_SECRET,
    { expiresIn: "24h" }
  );
}

export function verifyAdminToken(token: string): AdminSessionPayload | null {
  try {
    const decoded = jwt.verify(token, SESSION_SECRET) as AdminSessionPayload;
    if (decoded && decoded.role === "admin") {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export function getAdminSessionFromCookies(): AdminSessionPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export function getAdminSessionFromRequest(
  req: NextRequest
): AdminSessionPayload | null {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "adminpassword123",
  };
}

export { SESSION_COOKIE_NAME };
