"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  Lock,
  User,
  AlertCircle,
  Clock,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { AdminSummaryStats, RegistrationRecord } from "@/types";

export default function AdminDashboardPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard data states
  const [summary, setSummary] = useState<AdminSummaryStats | null>(null);
  const [attendees, setAttendees] = useState<RegistrationRecord[]>([]);
  const [eventsList, setEventsList] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & sorting
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("createdAt_desc");

  // Check current session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const json = await res.json();
        setIsAuthenticated(true);
        setAdminUsername(json.data.username);
        return true;
      } else {
        setIsAuthenticated(false);
        return false;
      }
    } catch {
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  // Fetch summary & events list
  const fetchSummaryAndEvents = useCallback(async () => {
    try {
      const [sumRes, evRes] = await Promise.all([
        fetch("/api/admin/summary"),
        fetch("/api/events"),
      ]);

      if (sumRes.ok) {
        const sumJson = await sumRes.json();
        setSummary(sumJson.data);
      }

      if (evRes.ok) {
        const evJson = await evRes.json();
        setEventsList(
          (evJson.data || []).map((e: { id: string; title: string }) => ({
            id: e.id,
            title: e.title,
          }))
        );
      }
    } catch (e) {
      console.error("Error loading summary:", e);
    }
  }, []);

  // Fetch attendees list based on search/filters
  const fetchAttendees = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (selectedEventId !== "ALL") query.set("eventId", selectedEventId);
      if (selectedStatus !== "ALL") query.set("status", selectedStatus);
      if (sortOrder) query.set("sort", sortOrder);

      const res = await fetch(`/api/admin/attendees?${query.toString()}`);
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load attendees.");
      }

      setAttendees(json.data || []);
    } catch (e: unknown) {
      console.error(e);
      setError((e as Error).message || "Failed to load attendee records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedEventId, selectedStatus, sortOrder]);

  // Initial load
  useEffect(() => {
    checkAuth().then((authed) => {
      if (authed) {
        fetchSummaryAndEvents();
        fetchAttendees();
      }
    });
  }, [checkAuth, fetchSummaryAndEvents, fetchAttendees]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error?.message || "Invalid credentials.");
        return;
      }

      setIsAuthenticated(true);
      setAdminUsername(data.data.username);
      setLoginPassword("");
      fetchSummaryAndEvents();
      fetchAttendees();
    } catch {
      setLoginError("Login failed due to a network error.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setAttendees([]);
    setSummary(null);
  };

  // Toggle status
  const handleToggleStatus = async (id: string, currentStatus: "CONFIRMED" | "CANCELLED") => {
    const newStatus = currentStatus === "CONFIRMED" ? "CANCELLED" : "CONFIRMED";
    try {
      const res = await fetch(`/api/admin/registrations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Refresh table & summary
        fetchAttendees(true);
        fetchSummaryAndEvents();
      }
    } catch (e) {
      console.error("Failed to toggle status:", e);
    }
  };

  // Loading initial auth check
  if (isAuthenticated === null) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Not authenticated: Login Screen
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              Admin Authentication
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Secure access to attendee management and event metrics.
            </p>
          </div>

          {loginError && (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Username</label>
              <div className="relative mt-1">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoggingIn ? "Authenticating..." : "Sign In to Dashboard"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Local Demo: <span className="font-mono text-slate-600">admin</span> /{" "}
              <span className="font-mono text-slate-600">adminpassword123</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar: Title & User Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
              Console
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Event Administration
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time attendee rosters, duplicate audit logs, and capacity monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <span className="block text-xs font-medium text-slate-400">Signed in as</span>
            <span className="text-sm font-semibold text-slate-800">{adminUsername}</span>
          </div>

          <button
            onClick={() => {
              fetchSummaryAndEvents();
              fetchAttendees(true);
            }}
            title="Refresh attendee data"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Events
            </span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {summary?.totalEvents ?? 0}
          </p>
          <span className="mt-1 block text-xs text-slate-500">
            Active configured sessions
          </span>
        </div>

        {/* Total Registrations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Registrations
            </span>
            <div className="rounded-xl bg-violet-50 p-2 text-violet-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {summary?.totalRegistrations ?? 0}
          </p>
          <span className="mt-1 block text-xs text-slate-500">
            Cumulative database submissions
          </span>
        </div>

        {/* Confirmed Registrations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Confirmed Seats
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {summary?.confirmedRegistrations ?? 0}
          </p>
          <span className="mt-1 block text-xs text-emerald-600 font-medium">
            Active & verified attendees
          </span>
        </div>

        {/* Total Remaining Capacity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Remaining Seats
            </span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {summary?.totalRemainingSeats ?? 0}
          </p>
          <span className="mt-1 block text-xs text-slate-500">
            Available across all events
          </span>
        </div>
      </div>

      {/* Attendee Management Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Table Controls / Filters Header */}
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Registered Attendees Roster
              </h2>
              <p className="text-xs text-slate-500">
                Live records directly queried from the relational database.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                Showing {attendees.length} record{attendees.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Filter Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email, org..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            {/* Event Filter */}
            <div>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="ALL">All Events</option>
                {eventsList.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed Only</option>
                <option value="CANCELLED">Cancelled Only</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="createdAt_desc">Date: Newest First</option>
                <option value="createdAt_asc">Date: Oldest First</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="mt-3 text-xs font-medium text-slate-500">
              Querying database records...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">{error}</div>
        ) : attendees.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              No registration records found
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {search || selectedEventId !== "ALL" || selectedStatus !== "ALL"
                ? "No attendees match your current filter criteria."
                : "No registrations have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Participant
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Organization
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Target Event
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Domain Interests
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Registration Date
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendees.map((attendee) => {
                  const regDate = new Date(attendee.createdAt);
                  const formattedDate = regDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const formattedTime = regDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const isConfirmed = attendee.status === "CONFIRMED";

                  return (
                    <tr
                      key={attendee.id}
                      className="hover:bg-slate-50/60 transition"
                    >
                      {/* Participant */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {attendee.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {attendee.email}
                        </div>
                      </td>

                      {/* Organization */}
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {attendee.collegeOrOrganization}
                      </td>

                      {/* Target Event */}
                      <td className="px-5 py-4 font-medium text-indigo-700">
                        {attendee.eventTitle || "Unknown Event"}
                      </td>

                      {/* Domain Interests */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {attendee.interests.map((interest) => (
                            <span
                              key={interest}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                        <div>{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">{formattedTime}</div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isConfirmed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                            <XCircle className="h-3 w-3" />
                            Cancelled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(attendee.id, attendee.status)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition border ${
                            isConfirmed
                              ? "border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {isConfirmed ? "Cancel" : "Reconfirm"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
