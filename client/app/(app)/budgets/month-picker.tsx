"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildBudgetsHref,
  formatYearMonth,
  parseBudgetMonth,
  shiftYearMonth,
} from "@/lib/budgets/types";

export function MonthPicker({
  selectedMonth,
  currentMonth,
}: {
  selectedMonth: string;
  currentMonth: string;
}) {
  const router = useRouter();
  const prevMonth = shiftYearMonth(selectedMonth, -1);
  const nextMonth = shiftYearMonth(selectedMonth, 1);
  const isCurrent = selectedMonth === currentMonth;

  function handleMonthChange(event: React.ChangeEvent<HTMLInputElement>) {
    const parsed = parseBudgetMonth(event.target.value);
    if (!parsed || parsed === selectedMonth) return;
    router.push(buildBudgetsHref(parsed, currentMonth));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <Button asChild variant="outline" size="icon" className="size-10">
          <Link
            href={buildBudgetsHref(prevMonth, currentMonth)}
            aria-label="Poprzedni miesiąc"
          >
            <ChevronLeftIcon className="size-4" />
          </Link>
        </Button>

        <Input
          type="month"
          aria-label="Wybierz miesiąc"
          value={selectedMonth}
          onChange={handleMonthChange}
          className="h-10 w-44"
        />

        <Button asChild variant="outline" size="icon" className="size-10">
          <Link
            href={buildBudgetsHref(nextMonth, currentMonth)}
            aria-label="Następny miesiąc"
          >
            <ChevronRightIcon className="size-4" />
          </Link>
        </Button>
      </div>

      <span className="text-sm font-medium capitalize text-muted-foreground">
        {formatYearMonth(selectedMonth)}
      </span>

      {!isCurrent ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={buildBudgetsHref(currentMonth, currentMonth)}>
            Bieżący miesiąc
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
