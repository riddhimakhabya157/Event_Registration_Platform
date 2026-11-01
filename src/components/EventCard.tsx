import Link from "next/link";
import { Calendar, MapPin, Users, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { EventWithCapacity } from "@/types";

interface EventCardProps {
  event: EventWithCapacity;
}

export default function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.scheduledAt);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
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

  const getStatusBadge = () => {
    switch (event.status) {
      case "FULL":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
            Full
          </span>
        );
      case "ALMOST_FULL":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
            Almost Full
          </span>
        );
      case "OPEN":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Registration Open
          </span>
        );
    }
  };

  const isFull = event.status === "FULL" || event.remainingSeats <= 0;

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between gap-2">
          {getStatusBadge()}
          <span className="text-xs font-medium text-slate-500">
            Capacity: {event.capacity}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
          {event.title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">
          {event.description}
        </p>

        <div className="mt-5 space-y-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              {formattedDate} at {formattedTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-700 font-semibold">
              {event.remainingSeats === 0
                ? "No seats remaining"
                : `${event.remainingSeats} seat${event.remainingSeats === 1 ? "" : "s"} remaining`}
            </span>
            <span className="text-slate-500">{percentOccupied}% filled</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isFull
                  ? "bg-rose-500"
                  : event.status === "ALMOST_FULL"
                  ? "bg-amber-500"
                  : "bg-indigo-600"
              }`}
              style={{ width: `${percentOccupied}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-2">
        <Link
          href={`/events/${event.id}`}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition ${
            isFull
              ? "bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-auto"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100"
          }`}
        >
          <span>{isFull ? "View Details (Full)" : "Register Now"}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
