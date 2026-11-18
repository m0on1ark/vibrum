"use client";

import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BUDGET_CURRENCY } from "@/lib/budgets/types";

export function CurrencyField({ id }: { id: string }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>Waluta</FieldLabel>
      <Input id={id} value={BUDGET_CURRENCY} readOnly disabled />
      <FieldDescription>
        Budżety są obsługiwane wyłącznie w walucie {BUDGET_CURRENCY}.
      </FieldDescription>
    </Field>
  );
}

export function LimitAmountField<TValues extends FieldValues>({
  control,
  name,
  id,
}: {
  control: Control<TValues>;
  name: Path<TValues>;
  id: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>Miesięczny limit ({BUDGET_CURRENCY})</FieldLabel>
          <Input
            id={id}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="np. 1500.00"
            value={
              typeof field.value === "number" && Number.isFinite(field.value)
                ? String(field.value)
                : ""
            }
            onChange={(event) => {
              const raw = event.target.value;
              field.onChange(raw === "" ? Number.NaN : Number(raw));
            }}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
