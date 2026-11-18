import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import { connection } from "next/server";

import { LoadError } from "@/components/load-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { API_PATHS } from "@/constants/api-paths";
import {
  ANALYTICS_CURRENCY,
  type AnalyticsSummary,
  parseAnalyticsMonth,
} from "@/lib/analytics/types";
import { currentYearMonth, formatYearMonth } from "@/lib/budgets/types";
import { formatMoney } from "@/lib/shared/format";
import { getJson } from "@/lib/shared/get-json";
import { cn } from "@/lib/utils";

function formatPercentChange(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

export async function DashboardSummaryCards({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Defer dynamic date & request parameter evaluation until request time for cacheComponents.
  await connection();
  const params = await searchParams;
  const month = parseAnalyticsMonth(params.month) ?? currentYearMonth();

  const summary = await getJson<AnalyticsSummary>(
    `${API_PATHS.analytics.summary}?month=${encodeURIComponent(month)}`,
  );
  if (!summary) return <LoadError subject="analytics summary" />;

  const changePercent = summary.expensesChangePercent;

  return (
    <section
      aria-label="Podsumowanie miesiąca"
      className="grid gap-4 md:grid-cols-3"
    >
      <Card>
        <CardHeader>
          <CardDescription>Przychody</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatMoney(summary.income, ANALYTICS_CURRENCY)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs capitalize text-muted-foreground">
            {formatYearMonth(summary.month)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Wydatki</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {formatMoney(summary.expenses, ANALYTICS_CURRENCY)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {changePercent !== null ? (
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium tabular-nums",
                  changePercent > 0
                    ? "text-destructive"
                    : changePercent < 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground",
                )}
              >
                {changePercent > 0 ? (
                  <ArrowUpRightIcon className="size-3.5" />
                ) : changePercent < 0 ? (
                  <ArrowDownRightIcon className="size-3.5" />
                ) : null}
                {formatPercentChange(changePercent)}
              </span>
              <span>
                vs poprzedni miesiąc (
                {formatMoney(summary.previousMonthExpenses, ANALYTICS_CURRENCY)}
                )
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Poprzedni miesiąc: {formatMoney(0, ANALYTICS_CURRENCY)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Bilans</CardDescription>
          <CardTitle
            className={cn(
              "text-2xl font-semibold tabular-nums",
              summary.balance >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive",
            )}
          >
            {formatMoney(summary.balance, ANALYTICS_CURRENCY)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Przychody minus wydatki
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
