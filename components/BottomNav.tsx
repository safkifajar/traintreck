"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/peta", label: "Peta" },
  { href: "/stasiun/pwt", label: "Stasiun PWT" },
  { href: "/kereta", label: "Daftar Kereta" },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    return pathname.startsWith(href.split("/").slice(0, 2).join("/"));
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_8px_rgba(0,0,0,0.06)] sm:inset-x-0 sm:bottom-auto sm:top-0 sm:border-b sm:border-t-0 sm:pb-0 sm:shadow-none">
      <div className="mx-auto flex max-w-2xl items-stretch sm:h-14 sm:items-center sm:justify-between sm:px-4">
        <Link
          href="/"
          className="hidden items-center font-semibold text-zinc-900 sm:flex"
        >
          Train Tracker{" "}
          <span className="ml-1 text-blue-700">Purwokerto</span>
        </Link>
        <div className="flex flex-1 sm:flex-none sm:gap-1">
          {ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-sm font-medium sm:min-h-0 sm:flex-none sm:flex-row sm:rounded-md sm:px-3 sm:py-1.5 ${
                  active
                    ? "font-semibold text-blue-700 sm:bg-blue-50"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
