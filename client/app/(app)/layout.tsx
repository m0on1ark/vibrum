import Link from "next/link";

import { signOutAction } from "@/app/(app)/actions";
import { Brand } from "@/components/auth/brand";
import { Button } from "@/components/ui/button";
import { APP_PATHS } from "@/constants";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <Link href={APP_PATHS.home} className="text-primary">
            <Brand size="sm" />
          </Link>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Wyloguj się
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
