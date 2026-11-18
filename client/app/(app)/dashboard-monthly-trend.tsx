import { connection } from "next/server";

import { LoadError } from "@/components/load-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_PATHS } from "@/constants/api-paths";
import { type MonthlyTotals, parseMonthlyRange } from "@/lib/analytics/types";
import { formatYearMonth } from "@/lib/budgets/types";
import {
  convertFromPln,
  formatOriginalPln,
  formatPrimaryFromPln,
} from "@/lib/currencies/base-currency";
import { getUserBaseCurrencyContext } from "@/lib/currencies/get-base-currency";
import { getJson } from "@/lib/shared/get-json";
import { cn } from "@/lib/utils";

import {
  DashboardMonthlyChart,
  type MonthlyChartPoint,
} from "./dashboard-monthly-chart";

function formatShortYearMonth(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  if (Number.isNaN(date.getTime())) return yearMonth;
  return new Intl.DateTimeFormat("pl-PL", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

export async function DashboardMonthlyTrend({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const months = parseMonthlyRange(params.months);

  const [items, baseCurrencyCtx] = await Promise.all([
    getJson<MonthlyTotals[]>(
      `${API_PATHS.analytics.monthly}?months=${months}`,
    ),
    getUserBaseCurrencyContext(),
  ]);
  if (!items) return <LoadError subject="monthly trend" />;

  const chartData: MonthlyChartPoint[] = items.map((item) => ({
    month: item.month,
    shortLabel: formatShortYearMonth(item.month),
    label: formatYearMonth(item.month),
    income: convertFromPln(item.income, baseCurrencyCtx),
    expenses: convertFromPln(item.expenses, baseCurrencyCtx),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend miesięczny</CardTitle>
        <CardDescription>{`Ostatnie ${months} mies.`}</CardDescription>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Brak danych do wyświetlenia trendu.
          </p>
        ) : (
          <div className="grid gap-6">
            <DashboardMonthlyChart
              data={chartData}
              currency={baseCurrencyCtx.baseCurrency}
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miesiąc</TableHead>
                  <TableHead className="text-right">Przychody</TableHead>
                  <TableHead className="text-right">Wydatki</TableHead>
                  <TableHead className="text-right">Bilans</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const net = item.income - item.expenses;
                  const netOrig = formatOriginalPln(net, baseCurrencyCtx);

                  return (
                    <TableRow key={item.month}>
                      <TableCell className="font-medium capitalize">
                        {formatYearMonth(item.month)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatPrimaryFromPln(item.income, baseCurrencyCtx)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-rose-600 dark:text-rose-400">
                        {formatPrimaryFromPln(item.expenses, baseCurrencyCtx)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          net >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive",
                        )}
                      >
                        <div>
                          {formatPrimaryFromPln(net, baseCurrencyCtx)}
                        </div>
                        {netOrig ? (
                          <div className="text-xs font-normal text-muted-foreground">
                            {netOrig}
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
