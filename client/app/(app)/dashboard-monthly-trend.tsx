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
import {
  ANALYTICS_CURRENCY,
  type MonthlyTotals,
  parseMonthlyRange,
} from "@/lib/analytics/types";
import { formatYearMonth } from "@/lib/budgets/types";
import { formatMoney } from "@/lib/shared/format";
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

  const items = await getJson<MonthlyTotals[]>(
    `${API_PATHS.analytics.monthly}?months=${months}`,
  );
  if (!items) return <LoadError subject="monthly trend" />;

  const chartData: MonthlyChartPoint[] = items.map((item) => ({
    month: item.month,
    shortLabel: formatShortYearMonth(item.month),
    label: formatYearMonth(item.month),
    income: item.income,
    expenses: item.expenses,
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
            <DashboardMonthlyChart data={chartData} />

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

                  return (
                    <TableRow key={item.month}>
                      <TableCell className="font-medium capitalize">
                        {formatYearMonth(item.month)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatMoney(item.income, ANALYTICS_CURRENCY)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-rose-600 dark:text-rose-400">
                        {formatMoney(item.expenses, ANALYTICS_CURRENCY)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          net >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive",
                        )}
                      >
                        {formatMoney(net, ANALYTICS_CURRENCY)}
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
