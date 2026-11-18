"use client";

import { PlusIcon } from "lucide-react";

import { InlineError } from "@/components/inline-error";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useServerAction } from "@/hooks/use-server-action";
import { formatYearMonth, type BudgetSummary } from "@/lib/budgets/types";
import type { Category } from "@/lib/categories/types";
import {
  type BaseCurrencyContext,
  DEFAULT_BASE_CURRENCY_CTX,
} from "@/lib/currencies/base-currency";

import { deleteBudgetAction } from "./actions";
import { BudgetCard } from "./budget-card";
import { BudgetOverview } from "./budget-overview";
import { CreateBudgetDialog } from "./create-budget-dialog";

export function BudgetList({
  summaries,
  expenseCategories,
  selectedMonth,
  currentMonth,
  baseCurrencyCtx = DEFAULT_BASE_CURRENCY_CTX,
}: {
  summaries: BudgetSummary[];
  expenseCategories: Category[];
  selectedMonth: string;
  currentMonth: string;
  baseCurrencyCtx?: BaseCurrencyContext;
}) {
  const { run, pending, error } = useServerAction();
  const existingCategoryIds = summaries.map((item) => item.categoryId);

  function handleDelete(item: BudgetSummary) {
    if (
      !window.confirm(
        `Usunąć budżet dla kategorii „${item.categoryName}” na ${formatYearMonth(selectedMonth)}?`,
      )
    ) {
      return;
    }
    run(() => deleteBudgetAction(item.budgetId));
  }

  if (summaries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brak budżetów</CardTitle>
          <CardDescription>
            Nie ustawiono jeszcze limitów wydatków na{" "}
            <span className="capitalize">{formatYearMonth(selectedMonth)}</span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateBudgetDialog
            expenseCategories={expenseCategories}
            existingCategoryIds={existingCategoryIds}
            selectedMonth={selectedMonth}
            currentMonth={currentMonth}
            trigger={
              <Button size="lg" className="h-11 text-base">
                <PlusIcon className="size-4" />
                Dodaj pierwszy budżet
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <BudgetOverview summaries={summaries} baseCurrencyCtx={baseCurrencyCtx} />

      <InlineError message={error} />

      <div className="grid gap-4 md:grid-cols-2">
        {summaries.map((item) => (
          <BudgetCard
            key={item.budgetId}
            item={item}
            pending={pending}
            onDelete={handleDelete}
            baseCurrencyCtx={baseCurrencyCtx}
          />
        ))}
      </div>
    </div>
  );
}
