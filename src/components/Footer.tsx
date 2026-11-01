import { Calendar, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <span className="font-semibold text-slate-800">EventHub Platform</span>
          <span className="text-xs text-slate-400">© {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <p className="text-xs text-slate-500">
          Built with Next.js, Prisma, SQLite, and Tailwind CSS. Relational integrity & duplicate prevention guaranteed.
        </p>
      </div>
    </footer>
  );
}
