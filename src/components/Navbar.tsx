"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Shield, Sparkles, Layers } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-100">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">EventHub</span>
            <span className="ml-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              Pro
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              pathname === "/"
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Events</span>
          </Link>

          <Link
            href="/admin"
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              isAdmin
                ? "bg-indigo-50 text-indigo-700 font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Shield className="h-4 w-4 text-indigo-600" />
            <span>Admin Dashboard</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
