import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DOMAIN_INTERESTS = [
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

async function main() {
  console.log("Starting database seeding...");

  // 1. Seed Domain Interests
  const interestMap = new Map<string, string>();
  for (const name of DOMAIN_INTERESTS) {
    const interest = await prisma.domainInterest.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    interestMap.set(name, interest.id);
  }
  console.log(`Seeded ${interestMap.size} domain interests.`);

  // 2. Seed Realistic Events
  const eventsData = [
    {
      title: "Web Development Workshop",
      slug: "web-development-workshop",
      description:
        "Master modern full-stack web engineering using Next.js App Router, TypeScript, and Tailwind CSS. Learn relational architecture, scalable state patterns, and API integration in a hands-on live coding intensive.",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      venue: "Tech Innovation Hall A & Virtual",
      capacity: 50,
    },
    {
      title: "AI & Machine Learning Summit",
      slug: "ai-machine-learning-summit",
      description:
        "Explore cutting-edge breakthroughs in Large Language Models, autonomous agentic workflows, and neural network optimization. Join leading industry researchers for technical keynotes and deep-dive breakout sessions.",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 14 days from now
      venue: "Grand Ballroom, Future Tech Center",
      capacity: 40,
    },
    {
      title: "Cybersecurity Bootcamp",
      slug: "cybersecurity-bootcamp",
      description:
        "A rigorous, hands-on offensive and defensive cybersecurity simulation. Topics include web application penetration testing, network threat hunting, identity zero-trust architecture, and secure API design.",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21), // 21 days from now
      venue: "Cyber Defense Lab 4, Cybernetics Wing",
      capacity: 25,
    },
    {
      title: "Data Science Conference",
      slug: "data-science-conference",
      description:
        "Transforming raw enterprise datasets into actionable predictive intelligence. Featuring production pipeline engineering, statistical modeling, distributed processing, and modern interactive data visualization frameworks.",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28), // 28 days from now
      venue: "Auditorium C, Science & Computing Complex",
      capacity: 60,
    },
  ];

  const createdEvents = [];
  for (const eventData of eventsData) {
    const event = await prisma.event.upsert({
      where: { slug: eventData.slug },
      update: {
        title: eventData.title,
        description: eventData.description,
        scheduledAt: eventData.scheduledAt,
        venue: eventData.venue,
        capacity: eventData.capacity,
      },
      create: eventData,
    });
    createdEvents.push(event);
  }
  console.log(`Seeded ${createdEvents.length} events.`);

  // 3. Seed A Few Identified Demo Registrations
  // Clearly identifiable demo registrations for dashboard testing & verification
  const demoRegistrations = [
    {
      eventIndex: 0,
      fullName: "Alex Rivera",
      email: "alex.rivera@example.edu",
      collegeOrOrganization: "Apex Institute of Technology",
      interests: ["Web Development", "UI/UX Design"],
    },
    {
      eventIndex: 0,
      fullName: "Priya Sharma",
      email: "priya.sharma@techcorp.com",
      collegeOrOrganization: "TechCorp Labs",
      interests: ["Web Development", "Cloud Computing"],
    },
    {
      eventIndex: 1,
      fullName: "Marcus Chen",
      email: "marcus.chen@stateuniv.edu",
      collegeOrOrganization: "State University AI Lab",
      interests: ["Artificial Intelligence", "Machine Learning", "Data Science"],
    },
    {
      eventIndex: 2,
      fullName: "Elena Rostova",
      email: "elena.rostova@cybersec.org",
      collegeOrOrganization: "National Security & Defense Academy",
      interests: ["Cybersecurity", "Cloud Computing"],
    },
  ];

  for (const reg of demoRegistrations) {
    const event = createdEvents[reg.eventIndex];
    const emailNormalized = reg.email.trim().toLowerCase();

    // Check if registration exists
    const existing = await prisma.registration.findUnique({
      where: {
        eventId_emailNormalized: {
          eventId: event.id,
          emailNormalized,
        },
      },
    });

    if (!existing) {
      const newReg = await prisma.registration.create({
        data: {
          eventId: event.id,
          fullName: reg.fullName,
          email: reg.email,
          emailNormalized,
          collegeOrOrganization: reg.collegeOrOrganization,
          status: "CONFIRMED",
        },
      });

      for (const interestName of reg.interests) {
        const domainInterestId = interestMap.get(interestName);
        if (domainInterestId) {
          await prisma.registrationInterest.create({
            data: {
              registrationId: newReg.id,
              domainInterestId,
            },
          });
        }
      }
    }
  }

  console.log(`Seeded ${demoRegistrations.length} demo registrations.`);
  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
