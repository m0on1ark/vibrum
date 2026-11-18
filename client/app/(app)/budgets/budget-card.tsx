"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BUDGET_STATUS_LABELS, type BudgetSummary } from "@/lib/budgets/types";
import {
  type BaseCurrencyContext,
  DEFAULT_BASE_CURRENCY_CTX,
  formatOriginalPln,
  formatPrimaryFromPln,
} from "@/lib/currencies/base-currency";
import { cn } from "@/lib/utils";

import {
  BudgetProgressBar,
  STATUS_BADGE_CLASSES,
  computeUsagePercent,
} from "./budget-progress-bar";
import { EditBudgetDialog } from "./edit-budget-dialog";

export function BudgetCard({
  item,
  pending,
  onDelete,
  baseCurrencyCtx = DEFAULT_BASE_CURRENCY_CTX,
}: {
  item: BudgetSummary;
  pending: boolean;
  onDelete: (item: BudgetSummary) => void;
  baseCurrencyCtx?: BaseCurrencyContext;
}) {
  const remaining = item.limitAmount - item.spentAmount;
  const percent = computeUsagePercent(item.spentAmount, item.limitAmount);
  const spentOrig = formatOriginalPln(item.spentAmount, baseCurrencyCtx);
  const limitOrig = formatOriginalPln(item.limitAmount, baseCurrencyCtx);

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>{item.categoryName}</CardTitle>
        <CardDescription>
          Wykorzystano {Math.round(percent)}% z limitu{" "}
          {formatPrimaryFromPln(item.limitAmount, baseCurrencyCtx)}
        </CardDescription>
        <CardAction>
          <Badge className={STATUS_BADGE_CLASSES[item.status]}>
            {BUDGET_STATUS_LABELS[item.status]}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-4">
        <BudgetProgressBar
          percent={percent}
          status={item.status}
          label={`Wykorzystanie budżetu: ${item.categoryName}`}
        />

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="grid gap-0.5">
            <dt className="text-muted-foreground">Wydano</dt>
            <dd className="font-medium tabular-nums">
              <div>{formatPrimaryFromPln(item.spentAmount, baseCurrencyCtx)}</div>
              {spentOrig ? (
                <div className="text-xs font-normal text-muted-foreground">
                  {spentOrig}
                </div>
              ) : null}
            </dd>
          </div>

          <div className="grid gap-0.5">
            <dt className="text-muted-foreground">
              {remaining >= 0 ? "Pozostało" : "Przekroczono o"}
            </dt>
            <dd
              className={cn(
                "font-medium tabular-nums",
                remaining >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive",
              )}
            >
              {formatPrimaryFromPln(Math.abs(remaining), baseCurrencyCtx)}
            </dd>
          </div>

          <div className="grid gap-0.5">
            <dt className="text-muted-foreground">Limit</dt>
            <dd className="font-medium tabular-nums">
              <div>{formatPrimaryFromPln(item.limitAmount, baseCurrencyCtx)}</div>
              {limitOrig ? (
                <div className="text-xs font-normal text-muted-foreground">
                  {limitOrig}
                </div>
              ) : null}
            </dd>
          </div>

          <div className="grid gap-0.5">
            <dt className="text-muted-foreground">Prognoza na koniec mies.</dt>
            <dd className="font-medium tabular-nums">
              {formatPrimaryFromPln(item.projectedAmount, baseCurrencyCtx)}
            </dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <EditBudgetDialog
          budget={item}
          trigger={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
            >
              <PencilIcon className="size-3.5" />
              Edytuj limit
            </Button>
          }
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => onDelete(item)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2Icon className="size-3.5" />
          Usuń
        </Button>
      </CardFooter>
    </Card>
  );
}
