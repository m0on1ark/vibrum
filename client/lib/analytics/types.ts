import { APP_PATHS } from "@/constants";
import { parseBudgetMonth } from "@/lib/budgets/types";

export const ANALYTICS_CURRENCY = "PLN" as const;

export const CATEGORY_CHART_COLORS = [
  "#0d9488",
  "#2563eb",
  "#d97706",
  "#7c3aed",
  "#e11d48",
  "#059669",
  "#ea580c",
  "#4f46e5",
  "#db2777",
  "#0284c7",
] as const;

export const MONTHLY_RANGE_OPTIONS = [3, 6, 12, 24] as const;

export type MonthlyRange = (typeof MONTHLY_RANGE_OPTIONS)[number];

export type AnalyticsSummary = {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  previousMonthExpenses: number;
  expensesChangePercent: number | null;
};

export type CategorySpending = {
  categoryId: number | null;
  categoryName: string | null;
  amount: number;
  percent: number;
};

export type MonthlyTotals = {
  month: string;
  income: number;
  expenses: number;
};

const DEFAULT_MONTHLY_RANGE: MonthlyRange = 6;
const VALID_MONTHLY_RANGES = new Set<number>(MONTHLY_RANGE_OPTIONS);

export function parseAnalyticsMonth(
  raw: string | string[] | undefined,
): string | null {
  return parseBudgetMonth(raw);
}

export function parseMonthlyRange(
  raw: string | string[] | undefined,
): MonthlyRange {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return DEFAULT_MONTHLY_RANGE;
  const parsed = Number(value);
  return Number.isInteger(parsed) && VALID_MONTHLY_RANGES.has(parsed)
    ? (parsed as MonthlyRange)
    : DEFAULT_MONTHLY_RANGE;
}

export function monthToDateRange(ym: string): { from: string; to: string } {
  const [yearStr, monthStr] = ym.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const lastDay = String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(
    2,
    "0",
  );
  return {
    from: `${ym}-01`,
    to: `${ym}-${lastDay}`,
  };
}

export function buildDashboardHref({
  month,
  months,
  currentMonth,
}: {
  month: string;
  months: MonthlyRange;
  currentMonth: string;
}): string {
  const params = new URLSearchParams();
  if (month !== currentMonth) params.set("month", month);
  if (months !== DEFAULT_MONTHLY_RANGE) params.set("months", String(months));
  const query = params.toString();
  return query ? `${APP_PATHS.home}?${query}` : APP_PATHS.home;
}
