"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormAction } from "@/hooks/use-form-action";
import { createBudgetSchema, type CreateBudgetInput } from "@/lib/budgets/schema";
import {
  BUDGET_CURRENCY,
  buildBudgetsHref,
  toMonthStartDate,
} from "@/lib/budgets/types";
import type { Category } from "@/lib/categories/types";

import { createBudgetAction } from "./actions";
import { CurrencyField, LimitAmountField } from "./budget-form-fields";

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

function buildYearOptions(currentMonth: string, selectedYm: string): string[] {
  const baseYear = Number(currentMonth.slice(0, 4)) || 2026;
  const selectedYear = Number(selectedYm.slice(0, 4)) || baseYear;
  const minYear = Math.min(baseYear - 5, selectedYear);
  const maxYear = Math.max(baseYear + 2, selectedYear);
  const years: string[] = [];
  for (let year = maxYear; year >= minYear; year -= 1) {
    years.push(String(year));
  }
  return years;
}

export function CreateBudgetDialog({
  expenseCategories,
  existingCategoryIds,
  selectedMonth,
  currentMonth,
  trigger,
}: {
  expenseCategories: Category[];
  existingCategoryIds: number[];
  selectedMonth: string;
  currentMonth: string;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const takenForSelectedMonth = new Set(existingCategoryIds);

  function buildDefaults(): CreateBudgetInput {
    const firstAvailable = expenseCategories.find(
      (c) => !takenForSelectedMonth.has(c.id),
    );
    return {
      categoryId: firstAvailable?.id ?? 0,
      monthYear: toMonthStartDate(selectedMonth),
      limitAmount: Number.NaN,
      currency: BUDGET_CURRENCY,
    };
  }

  const form = useForm<CreateBudgetInput>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: buildDefaults(),
  });
  const { isSubmitting } = form.formState;
  const watchedMonthYear = useWatch({
    control: form.control,
    name: "monthYear",
  });
  const isSelectedMonthInDialog =
    watchedMonthYear === toMonthStartDate(selectedMonth);

  const { submit, error, setError } = useFormAction(
    (values: CreateBudgetInput) => createBudgetAction(values),
    (values) => {
      setOpen(false);
      const createdYm = values.monthYear.slice(0, 7);
      if (createdYm !== selectedMonth) {
        router.push(buildBudgetsHref(createdYm, currentMonth));
      } else {
        router.refresh();
      }
    },
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setError(null);
      form.reset(buildDefaults());
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowy budżet</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <FormError message={error} />

            <Controller
              name="categoryId"
              control={form.control}
              render={({ field, fieldState }) => {
                const selectedCategory = expenseCategories.find(
                  (c) => c.id === field.value,
                );
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="budget-new-category">
                      Kategoria wydatków
                    </FieldLabel>
                    <Select
                      value={field.value > 0 ? String(field.value) : undefined}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={expenseCategories.length === 0}
                    >
                      <SelectTrigger id="budget-new-category" className="w-full">
                        <SelectValue placeholder="Wybierz kategorię wydatków">
                          {selectedCategory?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => {
                          const alreadySet =
                            isSelectedMonthInDialog &&
                            takenForSelectedMonth.has(category.id);
                          return (
                            <SelectItem
                              key={category.id}
                              value={String(category.id)}
                              disabled={alreadySet}
                            >
                              {category.name}
                              {alreadySet ? " (ma już budżet)" : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {expenseCategories.length === 0 ? (
                      <FieldDescription>
                        Brak dostępnych kategorii wydatków.
                      </FieldDescription>
                    ) : null}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                );
              }}
            />

            <Controller
              name="monthYear"
              control={form.control}
              render={({ field, fieldState }) => {
                const year = field.value.slice(0, 4) || currentMonth.slice(0, 4);
                const month = field.value.slice(5, 7) || currentMonth.slice(5, 7);
                const monthLabel =
                  MONTH_OPTIONS.find((item) => item.value === month)?.label ??
                  month;
                const yearOptions = buildYearOptions(
                  currentMonth,
                  `${year}-${month}`,
                );

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="budget-new-month">Miesiąc</FieldLabel>
                    <div className="grid grid-cols-[1fr_110px] gap-2">
                      <Select
                        value={month}
                        onValueChange={(nextMonth) => {
                          field.onChange(toMonthStartDate(`${year}-${nextMonth}`));
                        }}
                      >
                        <SelectTrigger id="budget-new-month" className="w-full">
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
                        onValueChange={(nextYear) => {
                          field.onChange(toMonthStartDate(`${nextYear}-${month}`));
                        }}
                      >
                        <SelectTrigger
                          id="budget-new-year"
                          aria-label="Rok"
                          className="w-full"
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
                    </div>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                );
              }}
            />

            <LimitAmountField
              control={form.control}
              name="limitAmount"
              id="budget-new-limit"
            />

            <CurrencyField id="budget-new-currency" />
          </FieldGroup>

          <DialogFooter className="mt-6">
            <SubmitButton pending={isSubmitting} pendingLabel="Tworzenie…">
              Utwórz budżet
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
