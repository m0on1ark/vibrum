"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { CurrencyCombobox } from "@/components/currency-combobox";
import { useFormAction } from "@/hooks/use-form-action";
import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { SPLIT_MODE_LABELS, SPLIT_MODES } from "@/constants";
import { Button } from "@/components/ui/button";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createExpenseSchema,
  type CreateExpenseInput,
} from "@/lib/groups/schema";
import { buildSplits } from "@/lib/groups/splits";
import { todayISO } from "@/lib/shared/format";

import { addExpenseAction } from "./actions";
import { SplitEntriesField } from "./split-entries-field";

export function AddExpenseForm({
  groupId,
  members,
}: {
  groupId: number;
  members: { userId: number; displayName: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Record<number, string>>({});
  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      title: "",
      amount: 0,
      currency: "PLN",
      expenseDate: todayISO(),
      splitMode: "EQUAL",
    },
  });
  const { isSubmitting } = form.formState;
  const splitMode = useWatch({ control: form.control, name: "splitMode" });

  const { submit, error } = useFormAction(
    (values: CreateExpenseInput) => {
      const splits = buildSplits(values, members, entries);
      if (typeof splits === "string") return Promise.resolve({ error: splits });
      return addExpenseAction(groupId, { ...values, splits });
    },
    () => {
      setOpen(false);
      form.reset();
      setEntries({});
      router.refresh();
    },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-11 text-base">
          Dodaj wydatek
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dodaj wydatek</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <FormError message={error} />

            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="expense-title">Tytuł</FieldLabel>
                  <Input
                    {...field}
                    id="expense-title"
                    placeholder="Zakupy na wyjazd"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="expense-amount">Kwota</FieldLabel>
                    <Input
                      id="expense-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={field.value || ""}
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber)
                      }
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="currency"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="expense-currency">Waluta</FieldLabel>
                    <CurrencyCombobox
                      id="expense-currency"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="expenseDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="expense-date">Data</FieldLabel>
                    <Input
                      {...field}
                      id="expense-date"
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="splitMode"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Podział</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPLIT_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {SPLIT_MODE_LABELS[mode]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>

            {splitMode !== "EQUAL" ? (
              <SplitEntriesField
                mode={splitMode}
                members={members}
                entries={entries}
                onChange={(userId, value) =>
                  setEntries((current) => ({ ...current, [userId]: value }))
                }
              />
            ) : null}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <SubmitButton pending={isSubmitting} pendingLabel="Dodawanie…">
              Dodaj wydatek
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
