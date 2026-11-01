# EventHub Pro — Event Registration Platform

A full-stack Event Registration Platform built to simplify event discovery, participant registration, and attendee management. The platform supports event-wise duplicate registration prevention, dynamic seat availability, and an admin dashboard for managing registrations.

## 1. Project Overview

The Event Registration Platform allows participants to explore available events, view event details, and register online. Administrators can manage registrations, monitor event capacity, search attendees, and update registration statuses.

The project focuses on relational database operations, backend validation, duplicate prevention, and reliable data persistence.

## 2. Key Features

### Public Event Showcase
- Displays available events with title, schedule, description, venue, and capacity.
- Shows registration availability and event status.
- Provides individual event detail pages.
- Displays updated seat availability.

### Participant Registration
- Registration form captures:
  - Full name
  - Email address
  - College or organization
  - Domain interests
- Client-side form validation.
- Server-side validation using Zod.
- Email normalization to prevent duplicate registrations caused by differences in letter casing.
- Confirmation after successful registration.

### Duplicate Registration Prevention
- The same email address cannot register for the same event more than once.
- The same email address can register for different events.
- A composite unique constraint is applied to `eventId` and `emailNormalized`.
- Duplicate registration attempts return **HTTP 409 Conflict**.
- Informative error messages are displayed to participants.

### Dynamic Seat Availability
- Available seats update after successful registration.
- Events reject registrations when capacity is reached.
- Registration capacity is checked on the server.

### Admin Dashboard
- Secure administrator login.
- Dashboard displays registration statistics.
- View and manage attendee registrations.
- Search attendees by relevant details.
- Filter and sort registration records.
- View registration status.
- Update registration status, including cancellation.

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js Route Handlers |
| Database | SQLite |
| ORM | Prisma 5 |
| Validation | Zod |
| Authentication | JWT |
| Testing | Vitest, Playwright |
| Runtime | Node.js |

## 4. GitHub Repository

**Repository:** [Event Registration Platform](https://github.com/riddhimakhabya157/Event_Registration_Platform)

The complete source code and project files are available in the GitHub repository.

## 5. Project Structure

```text
Event-Registration-Platform/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── attendees/
│   │   │   │   ├── login/
│   │   │   │   ├── logout/
│   │   │   │   ├── me/
│   │   │   │   ├── registrations/
│   │   │   │   └── summary/
│   │   │   │
│   │   │   └── events/
│   │   │       ├── [id]/
│   │   │       │   └── registrations/
│   │   │       └── route.ts
│   │   │
│   │   ├── events/
│   │   │   └── [id]/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── validations.ts
│   │
│   └── types/
│
├── tests/
│   ├── api.test.ts
│   ├── e2e.spec.ts
│   └── setup.ts
│
├── .env.example
├── package.json
├── prisma/schema.prisma
├── README.md
└── ...
```

*Note: The structure above describes the main project areas. Some filenames may differ depending on the generated implementation.*

## 6. Installation and Setup

### Prerequisites

- Node.js 20 or later
- npm
- Visual Studio Code (recommended)

### Step 1: Clone the repository

```bash
git clone https://github.com/riddhimakhabya157/Event_