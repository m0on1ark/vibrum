"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildDashboardHref,
  MONTHLY_RANGE_OPTIONS,
  type MonthlyRange,
} from "@/lib/analytics/types";
import { shiftYearMonth } from "@/lib/budgets/types";

const MONTH_OPTIONS = [
  { value: "01", label: "Styczeń" },
  { value: "02", label: "Luty" },
  { value: "03", label: "Marzec" },
  { value: "04", label: "Kwiecień" },
  { value: "05", label: "Maj" },
  { value: "06", label: "Czerwiec" },
  { value: "07", label: "Lipiec" },
  { value: "08", label: "Sierpień" },
  { value: "09", label: "Wrzesień" },
  { value: "10", label: "Październik" },
  { value: "11", label: "Listopad" },
  { value: "12", label: "Grudzień" },
] as const;

function buildYearOptions(currentMonth: string, selectedMonth: string): string[] {
  const baseYear = Number(currentMonth.slice(0, 4)) || 2026;
  const selectedYear = Number(selectedMonth.slice(0, 4)) || baseYear;
  const minYear = Math.min(baseYear - 5, selectedYear);
  const maxYear = Math.max(baseYear + 2, selectedYear);
  const years: string[] = [];
  for (let year = maxYear; year >= minYear; year -= 1) {
    years.push(String(year));
  }
  return years;
}

export function DashboardPeriodPicker({
  selectedMonth,
  currentMonth,
  selectedMonthsRange,
}: {
  selectedMonth: string;
  currentMonth: string;
  selectedMonthsRange: MonthlyRange;
}) {
  const router = useRouter();
  const prevMonth = shiftYearMonth(selectedMonth, -1);
  const nextMonth = shiftYearMonth(selectedMonth, 1);
  const isCurrent = selectedMonth === currentMonth;

  const year = selectedMonth.slice(0, 4);
  const month = selectedMonth.slice(5, 7);
  const monthLabel =
    MONTH_OPTIONS.find((item) => item.value === month)?.label ?? month;
  const yearOptions = buildYearOptions(currentMonth, selectedMonth);

  function navigateToMonth(nextYear: string, nextMonthValue: string) {
    const target = `${nextYear}-${nextMonthValue}`;
    if (target === selectedMonth) return;
    router.push(
      buildDashboardHref({
        month: target,
        months: selectedMonthsRange,
        currentMonth,
      }),
    );
  }

  function navigateToRange(nextRangeValue: string) {
    const nextRange = Number(nextRangeValue) as MonthlyRange;
    if (nextRange === selectedMonthsRange) return;
    router.push(
      buildDashboardHref({
        month: selectedMonth,
        months: nextRange,
        currentMonth,
      }),
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Button asChild variant="outline" size="icon" className="size-10">
            <Link
              href={buildDashboardHref({
                month: prevMonth,
                months: selectedMonthsRange,
                currentMonth,
              })}
              aria-label="Poprzedni miesiąc"
            >
              <ChevronLeftIcon className="size-4" />
            </Link>
          </Button>

          <Select
            value={month}
            onValueChange={(nextMonthValue) =>
              navigateToMonth(year, nextMonthValue)
            }
          >
            <SelectTrigger
              aria-label="Wybierz miesiąc"
              className="w-36 data-[size=default]:h-10"
            >
              <SelectValue>{monthLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={year}
            onValueChange={(nextYear) => navigateToMonth(nextYear, month)}
          >
            <SelectTrigger
              aria-label="Wybierz rok"
              className="w-24 data-[size=default]:h-10"
            >
              <SelectValue>{year}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((yearOption) => (
                <SelectItem key={yearOption} value={yearOption}>
                  {yearOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button asChild variant="outline" size="icon" className="size-10">
            <Link
              href={buildDashboardHref({
                month: nextMonth,
                months: selectedMonthsRange,
                currentMonth,
              })}
              aria-label="Następny miesiąc"
            >
              <ChevronRightIcon className="size-4" />
            </Link>
          </Button>
        </div>

        {!isCurrent ? (
          <Button asChild variant="ghost" size="sm">
            <Link
              href={buildDashboardHref({
                month: currentMonth,
                months: selectedMonthsRange,
                currentMonth,
              })}
            >
              Bieżący miesiąc
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Zakres trendu</span>
        <Select
          value={String(selectedMonthsRange)}
          onValueChange={navigateToRange}
        >
          <SelectTrigger
            aria-label="Zakres trendu"
            className="w-40 data-[size=default]:h-10"
          >
            <SelectValue>{`Ostatnie ${selectedMonthsRange} mies.`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {MONTHLY_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {`Ostatnie ${option} mies.`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
