export interface DomainInterestItem {
  id: string;
  name: string;
}

export interface EventWithCapacity {
  id: string;
  title: string;
  slug: string;
  description: string;
  scheduledAt: string | Date;
  venue: string;
  capacity: number;
  confirmedCount: number;
  remainingSeats: number;
  status: "OPEN" | "ALMOST_FULL" | "FULL";
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface RegistrationRecord {
  id: string;
  eventId: string;
  eventTitle?: string;
  eventSlug?: string;
  fullName: string;
  email: string;
  collegeOrOrganization: string;
  status: "CONFIRMED" | "CANCELLED";
  interests: string[];
  createdAt: string | Date;
}

export interface AdminSummaryStats {
  totalEvents: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  cancelledRegistrations: number;
  totalRemainingSeats: number;
  totalCapacity: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
