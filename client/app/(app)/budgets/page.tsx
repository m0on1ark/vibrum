import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { LoadError } from "@/components/load-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import {
  currentYearMonth,
  parseBudgetMonth,
  toMonthStartDate,
  type BudgetSummary,
} from "@/lib/budgets/types";
import type { Category } from "@/lib/categories/types";
import { getUserBaseCurrencyContext } from "@/lib/currencies/get-base-currency";
import { getJson } from "@/lib/shared/get-json";

import { BudgetList } from "./budget-list";
import { CreateBudgetDialog } from "./create-budget-dialog";
import { MonthPicker } from "./month-picker";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function BudgetsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Budżety
          </h1>
          <p className="text-muted-foreground">
            Ustalaj miesięczne limity wydatków dla kategorii i monitoruj postęp
            oraz prognozę wykorzystania.
          </p>
        </div>
        <Button asChild variant="outline" size="lg" className="h-11 text-base">
          <Link href={APP_PATHS.categories}>Kategorie</Link>
        </Button>
      </header>

      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <BudgetsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function BudgetsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Ensure dynamic runtime date evaluation is deferred to request time with cacheComponents.
  await connection();
  const rawParams = await searchParams;
  const currentMonth = currentYearMonth();
  const selectedMonth = parseBudgetMonth(rawParams.month) ?? currentMonth;
  const monthParam = toMonthStartDate(selectedMonth);

  const [summaries, categories, baseCurrencyCtx] = await Promise.all([
    getJson<BudgetSummary[]>(
      `${API_PATHS.budgets.summary}?month=${encodeURIComponent(monthParam)}`,
    ),
    getJson<Category[]>(API_PATHS.categories.root),
    getUserBaseCurrencyContext(),
  ]);

  if (!summaries) return <LoadError subject="budgets" />;
  if (!categories) return <LoadError subject="categories" />;

  const expenseCategories = categories.filter(
    (category) => category.type === "EXPENSE",
  );
  const existingCategoryIds = summaries.map((item) => item.categoryId);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MonthPicker
          selectedMonth={selectedMonth}
          currentMonth={currentMonth}
        />

        <CreateBudgetDialog
          expenseCategories={expenseCategories}
          existingCategoryIds={existingCategoryIds}
          selectedMonth={selectedMonth}
          currentMonth={currentMonth}
          trigger={
            <Button size="lg" className="h-11 text-base">
              <PlusIcon className="size-4" />
              Dodaj budżet
            </Button>
          }
        />
      </div>

      <BudgetList
        summaries={summaries}
        expenseCategories={expenseCategories}
        selectedMonth={selectedMonth}
        currentMonth={currentMonth}
        baseCurrencyCtx={baseCurrencyCtx}
      />
    </div>
  );
}
