"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BUDGET_CURRENCY,
  type BudgetStatus,
  type BudgetSummary,
} from "@/lib/budgets/types";
import { formatMoney } from "@/lib/shared/format";
import { pluralPl } from "@/lib/shared/plural";
import { cn } from "@/lib/utils";

import { BudgetProgressBar, computeUsagePercent } from "./budget-progress-bar";

export function BudgetOverview({ summaries }: { summaries: BudgetSummary[] }) {
  const totalLimit = summaries.reduce((sum, item) => sum + item.limitAmount, 0);
  const totalSpent = summaries.reduce((sum, item) => sum + item.spentAmount, 0);
  const totalProjected = summaries.reduce(
    (sum, item) => sum + item.projectedAmount,
    0,
  );
  const remaining = totalLimit - totalSpent;
  const percent = computeUsagePercent(totalSpent, totalLimit);

  const overallStatus: BudgetStatus =
    totalSpent > totalLimit
      ? "EXCEEDED"
      : totalProjected > totalLimit
        ? "WARNING"
        : "OK";

  return (
    <section aria-label="Podsumowanie miesiąca" className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Łączny limit
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1">
            <p className="text-2xl font-semibold tabular-nums">
              {formatMoney(totalLimit, BUDGET_CURRENCY)}
            </p>
            <CardDescription>
              {summaries.length}{" "}
              {pluralPl(
                summaries.length,
                "kategoria z budżetem",
                "kategorie z budżetem",
                "kategorii z budżetem",
              )}
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wydano łącznie
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <p className="text-2xl font-semibold tabular-nums">
              {formatMoney(totalSpent, BUDGET_CURRENCY)}
            </p>
            <BudgetProgressBar
              percent={percent}
              status={overallStatus}
              label="Łączne wykorzystanie budżetów"
            />
            <CardDescription>
              {Math.round(percent)}% łącznego limitu
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {remaining >= 0 ? "Pozostało do wydania" : "Przekroczenie łącznie"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1">
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                remaining >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive",
              )}
            >
              {formatMoney(Math.abs(remaining), BUDGET_CURRENCY)}
            </p>
            <CardDescription>
              Prognoza: {formatMoney(totalProjected, BUDGET_CURRENCY)}
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
