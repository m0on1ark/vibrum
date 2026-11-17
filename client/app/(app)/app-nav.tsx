"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_PATHS } from "@/constants";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: APP_PATHS.transactions, label: "Transakcje" },
  { href: APP_PATHS.categories, label: "Kategorie" },
  { href: APP_PATHS.groups, label: "Grupy" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Nawigacja główna"
      className="order-3 flex w-full items-center gap-1 overflow-x-auto lg:order-none lg:w-auto"
    >
      {ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              active && "bg-accent text-accent-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
