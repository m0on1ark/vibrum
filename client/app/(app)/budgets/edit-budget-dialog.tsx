"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";

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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useFormAction } from "@/hooks/use-form-action";
import { updateBudgetSchema, type UpdateBudgetInput } from "@/lib/budgets/schema";
import { formatYearMonth, type BudgetSummary } from "@/lib/budgets/types";

import { updateBudgetAction } from "./actions";
import { CurrencyField, LimitAmountField } from "./budget-form-fields";

export function EditBudgetDialog({
  budget,
  trigger,
}: {
  budget: BudgetSummary;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<UpdateBudgetInput>({
    resolver: zodResolver(updateBudgetSchema),
    defaultValues: { limitAmount: budget.limitAmount },
  });
  const { isSubmitting } = form.formState;

  const { submit, error, setError } = useFormAction(
    (values: UpdateBudgetInput) => updateBudgetAction(budget.budgetId, values),
    () => {
      setOpen(false);
      router.refresh();
    },
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setError(null);
      form.reset({ limitAmount: budget.limitAmount });
    }
  }

  const prefix = `budget-${budget.budgetId}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj budżet</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <FormError message={error} />

            <Field>
              <FieldLabel htmlFor={`${prefix}-category`}>Kategoria</FieldLabel>
              <Input
                id={`${prefix}-category`}
                value={budget.categoryName}
                readOnly
                disabled
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={`${prefix}-month`}>Miesiąc</FieldLabel>
              <Input
                id={`${prefix}-month`}
                value={formatYearMonth(budget.monthYear.slice(0, 7))}
                readOnly
                disabled
                className="capitalize"
              />
            </Field>

            <LimitAmountField
              control={form.control}
              name="limitAmount"
              id={`${prefix}-limit`}
            />

            <CurrencyField id={`${prefix}-currency`} />
          </FieldGroup>

          <DialogFooter className="mt-6">
            <SubmitButton pending={isSubmitting} pendingLabel="Zapisywanie…">
              Zapisz limit
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
