import { connection } from "next/server";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { parseAnalyticsMonth, parseMonthlyRange } from "@/lib/analytics/types";
import { currentYearMonth } from "@/lib/budgets/types";

import { DashboardCategorySpending } from "./dashboard-category-spending";
import { DashboardGreeting } from "./dashboard-greeting";
import { DashboardMonthlyTrend } from "./dashboard-monthly-trend";
import { DashboardPeriodPicker } from "./dashboard-period-picker";
import { DashboardSummaryCards } from "./dashboard-summary-cards";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="grid gap-8">
      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
        <DashboardGreeting />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <DashboardControlsSection searchParams={searchParams} />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }
      >
        <DashboardSummaryCards searchParams={searchParams} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
          <DashboardCategorySpending searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
          <DashboardMonthlyTrend searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function DashboardControlsSection({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await connection();
  const params = await searchParams;
  const currentMonth = currentYearMonth();
  const selectedMonth = parseAnalyticsMonth(params.month) ?? currentMonth;
  const selectedMonthsRange = parseMonthlyRange(params.months);

  return (
    <DashboardPeriodPicker
      selectedMonth={selectedMonth}
      currentMonth={currentMonth}
      selectedMonthsRange={selectedMonthsRange}
    />
  );
}
