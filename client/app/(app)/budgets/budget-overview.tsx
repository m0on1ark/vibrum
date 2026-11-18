"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type BudgetStatus, type BudgetSummary } from "@/lib/budgets/types";
import {
  type BaseCurrencyContext,
  DEFAULT_BASE_CURRENCY_CTX,
  formatOriginalPln,
  formatPrimaryFromPln,
} from "@/lib/currencies/base-currency";
import { pluralPl } from "@/lib/shared/plural";
import { cn } from "@/lib/utils";

import { BudgetProgressBar, computeUsagePercent } from "./budget-progress-bar";

export function BudgetOverview({
  summaries,
  baseCurrencyCtx = DEFAULT_BASE_CURRENCY_CTX,
}: {
  summaries: BudgetSummary[];
  baseCurrencyCtx?: BaseCurrencyContext;
}) {
  const totalLimit = summaries.reduce((sum, item) => sum + item.limitAmount, 0);
  const totalSpent = summaries.reduce((sum, item) => sum + item.spentAmount, 0);
  const totalProjected = summaries.reduce(
    (sum, item) => sum + item.projectedAmount,
    0,
  );
  const remaining = totalLimit - totalSpent;
  const percent = computeUsagePercent(totalSpent, totalLimit);

  const totalLimitOrig = formatOriginalPln(totalLimit, baseCurrencyCtx);
  const totalSpentOrig = formatOriginalPln(totalSpent, baseCurrencyCtx);
  const remainingOrig = formatOriginalPln(
    Math.abs(remaining),
    baseCurrencyCtx,
  );

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
              {formatPrimaryFromPln(totalLimit, baseCurrencyCtx)}
            </p>
            {totalLimitOrig ? (
              <p className="text-xs tabular-nums text-muted-foreground">
                {totalLimitOrig}
              </p>
            ) : null}
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
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {formatPrimaryFromPln(totalSpent, baseCurrencyCtx)}
              </p>
              {totalSpentOrig ? (
                <p className="text-xs tabular-nums text-muted-foreground">
                  {totalSpentOrig}
                </p>
              ) : null}
            </div>
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
              {formatPrimaryFromPln(Math.abs(remaining), baseCurrencyCtx)}
            </p>
            {remainingOrig ? (
              <p className="text-xs tabular-nums text-muted-foreground">
                {remainingOrig}
              </p>
            ) : null}
            <CardDescription>
              Prognoza: {formatPrimaryFromPln(totalProjected, baseCurrencyCtx)}
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
