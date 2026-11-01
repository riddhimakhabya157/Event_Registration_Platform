import { afterAll, beforeAll } from "vitest";

beforeAll(() => {
  process.env.DATABASE_URL = "file:./test.db";
  process.env.ADMIN_USERNAME = "admin";
  process.env.ADMIN_PASSWORD = "adminpassword123";
  process.env.ADMIN_SESSION_SECRET = "super-secret-session-key-at-least-32-chars-long";
});

afterAll(async () => {
  // cleanup
});
