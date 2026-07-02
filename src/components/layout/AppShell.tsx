"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/constants";
import { logoutAction } from "@/app/actions/auth";

export function AppShell({
  userName,
  talentName,
  children,
}: {
  userName: string;
  talentName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-zinc-200 px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
            Content Studio
          </p>
          <h1 className="mt-1 text-lg font-semibold text-zinc-900">{talentName}</h1>
          <p className="text-sm text-zinc-500">Social content workspace</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-violet-50 text-violet-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <span className="text-base opacity-70">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-200 p-4">
          <p className="truncate text-sm font-medium text-zinc-900">{userName}</p>
          <form action={logoutAction} className="mt-2">
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-zinc-800"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <p className="font-semibold text-zinc-900">Content Studio</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1 text-zinc-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
