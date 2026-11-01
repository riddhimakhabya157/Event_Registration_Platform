"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RegistrationForm from "@/components/RegistrationForm";
import { EventWithCapacity } from "@/types";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Share2,
} from "lucide-react";

interface EventDetailResponse extends EventWithCapacity {
  domainInterests: string[];
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchEvent = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Event not found.");
      }
      setEvent(json.data);
    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || "Failed to load event details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Immediate seat count update callback from RegistrationForm
  const handleRegistrationSuccess = (updatedData: {
    confirmedCount: number;
    remainingSeats: number;
  }) => {
    if (event) {
      const isFull = updatedData.remainingSeats <= 0;
      setEvent({
        ...event,
        confirmedCount: updatedData.confirmedCount,
        remainingSeats: updatedData.remainingSeats,
        status: isFull
          ? "FULL"
          : updatedData.remainingSeats <= Math.ceil(event.capacity * 0.25)
          ? "ALMOST_FULL"
          : "OPEN",
      });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-slate-600">
          Loading event information...
        </p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-rose-800">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-600" />
          <h2 className="mt-3 text-lg font-bold">Event Not Found</h2>
          <p className="mt-1 text-sm text-rose-700">
            {error || "The event you requested could not be located."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to All Events</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.scheduledAt);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const percentOccupied = Math.min(
    100,
    Math.round((event.confirmedCount / event.capacity) * 100)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb & Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Events</span>
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Share2 className="h-3.5 w-3.5 text-slate-500" />
          <span>{copied ? "Link Copied!" : "Share Event"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Event Details & Schedule */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {event.status === "FULL" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                  Full Capacity
                </span>
              ) : event.status === "ALMOST_FULL" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                  Almost Full
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Registration Open
                </span>
              )}

              <span className="text-xs text-slate-500 font-medium">
                ID: {event.id}
              </span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {event.title}
            </h1>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-medium text-slate-500">Date & Schedule</span>
                  <span className="font-semibold text-slate-900">{formattedDate}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{formattedTime}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-medium text-slate-500">Venue / Mode</span>
                  <span className="font-semibold text-slate-900">{event.venue}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Physical & Hybrid Stream</span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="text-base font-bold text-slate-900">About this Event</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Capacity Meter */}
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  <span className="font-semibold text-slate-900">
                    Seat Allocation Quota
                  </span>
                </div>
                <span className="font-bold text-indigo-600">
                  {event.remainingSeats === 0
                    ? "0 seats remaining"
                    : `${event.remainingSeats} of ${event.capacity} seats remaining`}
                </span>
              </div>

              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    event.remainingSeats === 0
                      ? "bg-rose-500"
                      : event.status === "ALMOST_FULL"
                      ? "bg-amber-500"
                      : "bg-indigo-600"
                  }`}
                  style={{ width: `${percentOccupied}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>{event.confirmedCount} Confirmed Attendees</span>
                <span>{percentOccupied}% Capacity Filled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Participant Registration Form */}
        <div className="lg:col-span-5 sticky top-24">
          <RegistrationForm
            eventId={event.id}
            eventTitle={event.title}
            remainingSeats={event.remainingSeats}
            availableInterests={event.domainInterests}
            onRegistrationSuccess={handleRegistrationSuccess}
          />
        </div>
      </div>
    </div>
  );
}
