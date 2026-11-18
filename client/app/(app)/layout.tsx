import { User } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Brand } from "@/components/auth/brand";
import { APP_PATHS } from "@/constants";

import { AppNav } from "./app-nav";
import { NotificationsBell } from "./notifications-bell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:h-16 lg:flex-nowrap lg:py-0">
          <Link href={APP_PATHS.home} className="shrink-0 text-primary">
            <Brand size="sm" />
          </Link>
          <Suspense>
            <AppNav />
          </Suspense>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Suspense>
              <NotificationsBell />
            </Suspense>
            <Link
              href={APP_PATHS.profile}
              aria-label="Profil"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted/40 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <User className="size-5" />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
