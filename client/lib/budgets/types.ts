import { APP_PATHS } from "@/constants";

export const BUDGET_STATUSES = ["OK", "WARNING", "EXCEEDED"] as const;

export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

export type Budget = {
  id: number;
  categoryId: number;
  categoryName: string;
  monthYear: string;
  limitAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type BudgetSummary = {
  budgetId: number;
  categoryId: number;
  categoryName: string;
  monthYear: string;
  limitAmount: number;
  currency: string;
  spentAmount: number;
  projectedAmount: number;
  status: BudgetStatus;
};

export const BUDGET_CURRENCY = "PLN" as const;

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  OK: "W normie",
  WARNING: "Zagrożony",
  EXCEEDED: "Przekroczony",
};

const YEAR_MONTH_RE = /^(\d{4})-(\d{2})(?:-\d{2})?$/;

export function currentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function parseBudgetMonth(
  raw: string | string[] | undefined,
): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const match = YEAR_MONTH_RE.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return null;

  return `${match[1]}-${match[2]}`;
}

export function toMonthStartDate(yearMonth: string): string {
  return `${yearMonth}-01`;
}

export function shiftYearMonth(yearMonth: string, deltaMonths: number): string {
  const [yearStr, monthStr] = yearMonth.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + deltaMonths, 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatYearMonth(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  if (Number.isNaN(date.getTime())) return yearMonth;
  return new Intl.DateTimeFormat("pl-PL", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function buildBudgetsHref(
  yearMonth: string,
  currentMonth: string,
): string {
  return yearMonth === currentMonth
    ? APP_PATHS.budgets
    : `${APP_PATHS.budgets}?month=${yearMonth}`;
}
