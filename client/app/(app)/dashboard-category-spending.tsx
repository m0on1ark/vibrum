import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

import { LoadError } from "@/components/load-error";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_PATHS } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import {
  ANALYTICS_CURRENCY,
  CATEGORY_CHART_COLORS,
  type CategorySpending,
  monthToDateRange,
  parseAnalyticsMonth,
} from "@/lib/analytics/types";
import { currentYearMonth, formatYearMonth } from "@/lib/budgets/types";
import { formatMoney } from "@/lib/shared/format";
import { getJson } from "@/lib/shared/get-json";

import { DashboardCategoryChart } from "./dashboard-category-chart";

function buildCategoryTransactionsHref(
  from: string,
  to: string,
  categoryId: number | null,
): string {
  const params = new URLSearchParams({
    startDate: from,
    endDate: to,
  });
  if (categoryId !== null) {
    params.set("categoryId", String(categoryId));
  }
  return `${APP_PATHS.transactions}?${params.toString()}`;
}

export async function DashboardCategorySpending({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const month = parseAnalyticsMonth(params.month) ?? currentYearMonth();
  const { from, to } = monthToDateRange(month);

  const items = await getJson<CategorySpending[]>(
    `${API_PATHS.analytics.byCategory}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
  if (!items) return <LoadError subject="category spending" />;

  const totalExpenses = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wydatki według kategorii</CardTitle>
        <CardDescription className="capitalize">
          {formatYearMonth(month)}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="grid gap-3 py-4 text-sm text-muted-foreground">
            <p>Brak wydatków w wybranym miesiącu.</p>
            <div>
              <Button asChild variant="outline" size="sm">
                <Link href={APP_PATHS.transactions}>Przejdź do transakcji</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            <DashboardCategoryChart
              items={items}
              totalExpenses={totalExpenses}
              colors={CATEGORY_CHART_COLORS}
            />

            <ul className="grid gap-3">
              {items.map((item, index) => {
                const name = item.categoryName ?? "Bez kategorii";
                const color =
                  CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length];
                const txHref = buildCategoryTransactionsHref(
                  from,
                  to,
                  item.categoryId,
                );

                return (
                  <li
                    key={item.categoryId ?? "uncategorized"}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate font-medium">{name}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {item.percent.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium tabular-nums">
                        {formatMoney(item.amount, ANALYTICS_CURRENCY)}
                      </span>
                      <Link
                        href={txHref}
                        aria-label={`Zobacz transakcje: ${name}`}
                        className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ArrowUpRightIcon className="size-3.5" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
