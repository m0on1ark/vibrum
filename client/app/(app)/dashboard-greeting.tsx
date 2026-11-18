import Link from "next/link";

import { LoadError } from "@/components/load-error";
import { Button } from "@/components/ui/button";
import { APP_PATHS } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import type { CurrentUser } from "@/lib/auth/schema";
import { getJson } from "@/lib/shared/get-json";

export async function DashboardGreeting() {
  const user = await getJson<CurrentUser>(API_PATHS.users.me);
  if (!user) return <LoadError subject="account details" />;

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="grid gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Witaj, {user.displayName}
        </h1>
        <p className="text-muted-foreground">
          {`Przegląd Twoich finansów, struktury wydatków i trendów miesięcznych w walucie ${user.baseCurrency}.`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline">
          <Link href={APP_PATHS.transactions}>Transakcje</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={APP_PATHS.accounts}>Konta i import</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={APP_PATHS.budgets}>Budżety</Link>
        </Button>
      </div>
    </header>
  );
}
