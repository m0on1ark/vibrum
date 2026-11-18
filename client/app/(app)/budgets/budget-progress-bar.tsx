"use client";

import type { BudgetStatus } from "@/lib/budgets/types";
import { cn } from "@/lib/utils";

export const STATUS_BADGE_CLASSES: Record<BudgetStatus, string> = {
  OK: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  WARNING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  EXCEEDED: "bg-destructive/15 text-destructive",
};

const STATUS_BAR_CLASSES: Record<BudgetStatus, string> = {
  OK: "bg-emerald-600 dark:bg-emerald-500",
  WARNING: "bg-amber-500",
  EXCEEDED: "bg-destructive",
};

export function computeUsagePercent(spent: number, limit: number): number {
  if (limit <= 0) return spent > 0 ? 100 : 0;
  return Math.max(0, (spent / limit) * 100);
}

export function BudgetProgressBar({
  percent,
  status,
  label,
}: {
  percent: number;
  status: BudgetStatus;
  label: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn(
          "h-full rounded-full transition-all",
          STATUS_BAR_CLASSES[status],
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
