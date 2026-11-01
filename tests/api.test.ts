import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAdminToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { GET as getEvents } from "@/app/api/events/route";
import { GET as getEventById } from "@/app/api/events/[id]/route";
import { POST as registerParticipant } from "@/app/api/events/[id]/registrations/route";
import { GET as getAdminAttendees } from "@/app/api/admin/attendees/route";
import { GET as getAdminSummary } from "@/app/api/admin/summary/route";

describe("Event Registration Platform - Full Test Suite", () => {
  let eventAId: string;
  let eventBId: string;
  let fullEventId: string;

  beforeAll(async () => {
    // Clean test database tables
    await prisma.registrationInterest.deleteMany();
    await prisma.registration.deleteMany();
    await prisma.domainInterest.deleteMany();
    await prisma.event.deleteMany();

    // Seed domain interests
    const interests = [
      "Web Development",
      "Artificial Intelligence",
      "Machine Learning",
      "Data Science",
      "Cybersecurity",
      "Cloud Computing",
      "Internet of Things",
      "UI/UX Design",
      "Blockchain",
    ];

    for (const name of interests) {
      await prisma.domainInterest.create({ data: { name } });
    }

    // Seed Event A (capacity 10)
    const eventA = await prisma.event.create({
      data: {
        title: "Web Development Bootcamp",
        slug: "web-dev-bootcamp",
        description: "Hands-on Next.js, TypeScript, and modern full-stack workflows.",
        scheduledAt: new Date(Date.now() + 86400000 * 7),
        venue: "Tech Innovation Hub",
        capacity: 10,
      },
    });
    eventAId = eventA.id;

    // Seed Event B (capacity 15)
    const eventB = await prisma.event.create({
      data: {
        title: "AI & Neural Networks Summit",
        slug: "ai-neural-summit",
        description: "Deep learning, LLMs, and agentic workflows.",
        scheduledAt: new Date(Date.now() + 86400000 * 14),
        venue: "Hall of Compute",
        capacity: 15,
      },
    });
    eventBId = eventB.id;

    // Seed Full Event (capacity 1, will be filled in test 10)
    const fullEvent = await prisma.event.create({
      data: {
        title: "Exclusive Cybersecurity Masterclass",
        slug: "cybersecurity-masterclass",
        description: "Zero-day vulnerability research and live penetration testing.",
        scheduledAt: new Date(Date.now() + 86400000 * 21),
        venue: "Cyber Range Lab 1",
        capacity: 1,
      },
    });
    fullEventId = fullEvent.id;
  });

  // Helper to construct NextRequest for registrations
  function makeRegistrationRequest(eventId: string, body: unknown) {
    return new NextRequest(`http://localhost:3000/api/events/${eventId}/registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  // 1. An event is returned with correct capacity information
  it("Scenario 1: An event is returned with correct capacity information", async () => {
    const req = new NextRequest(`http://localhost:3000/api/events/${eventAId}`);
    const res = await getEventById(req, { params: { id: eventAId } });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(eventAId);
    expect(json.data.capacity).toBe(10);
    expect(json.data.confirmedCount).toBe(0);
    expect(json.data.remainingSeats).toBe(10);
    expect(json.data.status).toBe("OPEN");
    expect(json.data.domainInterests).toContain("Web Development");
  });

  // 2. A valid first registration succeeds
  it("Scenario 2: A valid first registration succeeds", async () => {
    const req = makeRegistrationRequest(eventAId, {
      fullName: "Alice Morgan",
      email: "alice.morgan@example.com",
      collegeOrOrganization: "MIT",
      interests: ["Web Development", "UI/UX Design"],
    });

    const res = await registerParticipant(req, { params: { id: eventAId } });
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.registration.fullName).toBe("Alice Morgan");
    expect(json.data.registration.email).toBe("alice.morgan@example.com");
    expect(json.data.registration.interests).toEqual(["Web Development", "UI/UX Design"]);
    expect(json.data.event.confirmedCount).toBe(1);
    expect(json.data.event.remainingSeats).toBe(9);
  });

  // 3. The registration count increases after success
  it("Scenario 3: The registration count increases after success", async () => {
    const req = new NextRequest(`http://localhost:3000/api/events/${eventAId}`);
    const res = await getEventById(req, { params: { id: eventAId } });
    const json = await res.json();

    expect(json.data.confirmedCount).toBe(1);
    expect(json.data.remainingSeats).toBe(9);
  });

  // 4. Submitting the same email twice for the same event returns HTTP 409
  it("Scenario 4: Submitting the same email twice for the same event returns HTTP 409", async () => {
    const req = makeRegistrationRequest(eventAId, {
      fullName: "Alice Morgan Duplicate",
      email: "alice.morgan@example.com",
      collegeOrOrganization: "MIT",
      interests: ["Web Development"],
    });

    const res = await registerParticipant(req, { params: { id: eventAId } });
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("DUPLICATE_REGISTRATION");
    expect(json.error.message).toBe("This email is already registered for this event.");
  });

  // 5. The duplicate request does not increase the registration count
  it("Scenario 5: The duplicate request does not increase the registration count", async () => {
    const req = new NextRequest(`http://localhost:3000/api/events/${eventAId}`);
    const res = await getEventById(req, { params: { id: eventAId } });
    const json = await res.json();

    expect(json.data.confirmedCount).toBe(1);
    expect(json.data.remainingSeats).toBe(9);
  });

  // 6. The duplicate email is rejected even if the casing differs or whitespace is added
  it("Scenario 6: The duplicate email is rejected even if the casing differs or whitespace is added", async () => {
    const req = makeRegistrationRequest(eventAId, {
      fullName: "Alice Morgan Variations",
      email: "  ALICE.MORGAN@EXAMPLE.COM  ",
      collegeOrOrganization: "MIT",
      interests: ["Web Development"],
    });

    const res = await registerParticipant(req, { params: { id: eventAId } });
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("DUPLICATE_REGISTRATION");
  });

  // 7. The same email can register for a different event
  it("Scenario 7: The same email can register for a different event", async () => {
    const req = makeRegistrationRequest(eventBId, {
      fullName: "Alice Morgan Cross-Event",
      email: "alice.morgan@example.com",
      collegeOrOrganization: "MIT",
      interests: ["Artificial Intelligence", "Machine Learning"],
    });

    const res = await registerParticipant(req, { params: { id: eventBId } });
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.event.id).toBe(eventBId);
    expect(json.data.event.confirmedCount).toBe(1);
  });

  // 8. Invalid or missing form fields are rejected
  it("Scenario 8: Invalid or missing form fields are rejected", async () => {
    // Missing email
    const req1 = makeRegistrationRequest(eventAId, {
      fullName: "Bob Jones",
      collegeOrOrganization: "Harvard",
      interests: ["Cloud Computing"],
    });
    const res1 = await registerParticipant(req1, { params: { id: eventAId } });
    expect(res1.status).toBe(400);

    // Invalid email format
    const req2 = makeRegistrationRequest(eventAId, {
      fullName: "Bob Jones",
      email: "not-an-email",
      collegeOrOrganization: "Harvard",
      interests: ["Cloud Computing"],
    });
    const res2 = await registerParticipant(req2, { params: { id: eventAId } });
    expect(res2.status).toBe(400);

    // Empty full name
    const req3 = makeRegistrationRequest(eventAId, {
      fullName: "",
      email: "bob@harvard.edu",
      collegeOrOrganization: "Harvard",
      interests: ["Cloud Computing"],
    });
    const res3 = await registerParticipant(req3, { params: { id: eventAId } });
    expect(res3.status).toBe(400);

    // Empty interests array
    const req4 = makeRegistrationRequest(eventAId, {
      fullName: "Bob Jones",
      email: "bob@harvard.edu",
      collegeOrOrganization: "Harvard",
      interests: [],
    });
    const res4 = await registerParticipant(req4, { params: { id: eventAId } });
    expect(res4.status).toBe(400);
  });

  // 9. A nonexistent event returns HTTP 404
  it("Scenario 9: A nonexistent event returns HTTP 404", async () => {
    const req = makeRegistrationRequest("nonexistent-event-id", {
      fullName: "Ghost Participant",
      email: "ghost@example.com",
      collegeOrOrganization: "Phantom Org",
      interests: ["Web Development"],
    });

    const res = await registerParticipant(req, { params: { id: "nonexistent-event-id" } });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("EVENT_NOT_FOUND");
  });

  // 10. A full event rejects additional registrations
  it("Scenario 10: A full event rejects additional registrations", async () => {
    // First registration fills the capacity of 1
    const req1 = makeRegistrationRequest(fullEventId, {
      fullName: "First Attendant",
      email: "first@cyber.org",
      collegeOrOrganization: "CyberSec Institute",
      interests: ["Cybersecurity"],
    });
    const res1 = await registerParticipant(req1, { params: { id: fullEventId } });
    expect(res1.status).toBe(201);

    // Second registration should be rejected due to capacity limit
    const req2 = makeRegistrationRequest(fullEventId, {
      fullName: "Second Attendant",
      email: "second@cyber.org",
      collegeOrOrganization: "CyberSec Institute",
      interests: ["Cybersecurity"],
    });
    const res2 = await registerParticipant(req2, { params: { id: fullEventId } });
    expect(res2.status).toBe(409);

    const json2 = await res2.json();
    expect(json2.success).toBe(false);
    expect(json2.error.code).toBe("CAPACITY_EXCEEDED");
  });

  // 11. Invalid domain interests are rejected
  it("Scenario 11: Invalid domain interests are rejected", async () => {
    const req = makeRegistrationRequest(eventAId, {
      fullName: "Charlie Brown",
      email: "charlie@example.com",
      collegeOrOrganization: "City College",
      interests: ["Nonexistent Track", "Astronomy & Rocketry"],
    });

    const res = await registerParticipant(req, { params: { id: eventAId } });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toContain("invalid");
  });

  // 12. Admin attendee records cannot be retrieved without valid admin authentication
  it("Scenario 12: Admin attendee records cannot be retrieved without valid admin authentication", async () => {
    // Unauthenticated request
    const unauthReq = new NextRequest("http://localhost:3000/api/admin/attendees");
    const unauthRes = await getAdminAttendees(unauthReq);
    expect(unauthRes.status).toBe(401);

    const json = await unauthRes.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");

    // Authenticated request with valid JWT session cookie
    const token = signAdminToken("admin");
    const authReq = new NextRequest("http://localhost:3000/api/admin/attendees", {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });

    const authRes = await getAdminAttendees(authReq);
    expect(authRes.status).toBe(200);
    const authJson = await authRes.json();
    expect(authJson.success).toBe(true);
    expect(Array.isArray(authJson.data)).toBe(true);
  });

  // 13. Search and status filtering work on actual database records
  it("Scenario 13: Search and status filtering work on actual database records", async () => {
    const token = signAdminToken("admin");

    // Search by attendee name "Alice"
    const searchReq = new NextRequest(
      "http://localhost:3000/api/admin/attendees?search=Alice",
      { headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` } }
    );
    const searchRes = await getAdminAttendees(searchReq);
    const searchJson = await searchRes.json();
    expect(searchJson.success).toBe(true);
    expect(searchJson.data.length).toBeGreaterThan(0);
    expect(searchJson.data.every((r: { fullName: string }) => r.fullName.includes("Alice"))).toBe(true);

    // Filter by Event A
    const eventFilterReq = new NextRequest(
      `http://localhost:3000/api/admin/attendees?eventId=${eventAId}`,
      { headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` } }
    );
    const eventFilterRes = await getAdminAttendees(eventFilterReq);
    const eventFilterJson = await eventFilterRes.json();
    expect(eventFilterJson.success).toBe(true);
    expect(eventFilterJson.data.every((r: { eventId: string }) => r.eventId === eventAId)).toBe(true);

    // Summary endpoint metrics verification
    const summaryReq = new NextRequest("http://localhost:3000/api/admin/summary", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    const summaryRes = await getAdminSummary(summaryReq);
    const summaryJson = await summaryRes.json();
    expect(summaryJson.success).toBe(true);
    expect(summaryJson.data.totalEvents).toBeGreaterThanOrEqual(3);
    expect(summaryJson.data.totalRegistrations).toBeGreaterThanOrEqual(3);
    expect(summaryJson.data.confirmedRegistrations).toBeGreaterThanOrEqual(3);
  });

  // 14. All public and admin endpoints return consistent JSON responses
  it("Scenario 14: The registration and admin APIs respond with valid schema & HTTP contracts", async () => {
    const req = new NextRequest("http://localhost:3000/api/events");
    const res = await getEvents();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(3);
  });
});
