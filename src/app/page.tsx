"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import { EventWithCapacity } from "@/types";
import { Sparkles, Calendar, Search, Users, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";

export default function HomePage() {
  const [events, setEvents] = useState<EventWithCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load events.");
      }
      setEvents(json.data || []);
    } catch (err: unknown) {
      console.error(err);
      setError("Unable to connect to the database. Please ensure migrations have run.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Gen Academic & Tech Events Platform</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Register for Premier Tech <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Workshops & Conferences
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
            Explore curated technical bootcamps, AI summits, and engineering workshops.
            Enjoy instant seat confirmation, relational consistency, and atomic capacity tracking.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Duplicate-Proof Registrations</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Real-Time Seat Quotas</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-600" />
              <span>Verified Tech Tracks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Events Listing Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Upcoming Events
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Browse upcoming sessions, monitor available capacity, and register your participation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <button
              onClick={fetchEvents}
              title="Refresh events list"
              className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Content States */}
        {loading && events.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading upcoming events from database...
            </p>
          </div>
        ) : error ? (
          <div className="my-12 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
            <h3 className="mt-2 text-base font-semibold">Database Connection Error</h3>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
            <button
              onClick={fetchEvents}
              className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No matching events found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery
                ? `No events match "${searchQuery}". Try a different keyword.`
                : "No upcoming events scheduled at this moment. Check back soon."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
