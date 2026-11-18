"use client";

import { useState } from "react";
import { Controller, useWatch, type Control } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
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
import type { RuleInput } from "@/lib/categories/schema";
import {
  CATEGORY_TYPE_LABELS,
  RULE_MATCH_TYPE_LABELS,
  RULE_MATCH_TYPES,
  RULE_TARGET_LABELS,
  RULE_TARGETS,
  type Category,
} from "@/lib/categories/types";

function parsePriorityInput(raw: string): number {
  const trimmed = raw.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number.NaN;
  }
  const parsed = Number(trimmed);
  return Object.is(parsed, -0) ? 0 : parsed;
}

export function RuleFormFields({
  control,
  categories,
  prefix,
}: {
  control: Control<RuleInput>;
  categories: Category[];
  prefix: string;
}) {
  return (
    <>
      <CategorySelectField
        control={control}
        categories={categories}
        id={`${prefix}-category`}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RuleEnumSelectField
          control={control}
          name="matchType"
          id={`${prefix}-match-type`}
          label="Typ dopasowania"
          options={RULE_MATCH_TYPES}
          labels={RULE_MATCH_TYPE_LABELS}
        />

        <RuleEnumSelectField
          control={control}
          name="target"
          id={`${prefix}-target`}
          label="Dopasuj w polu"
          options={RULE_TARGETS}
          labels={RULE_TARGET_LABELS}
        />
      </div>

      <PatternField control={control} id={`${prefix}-pattern`} />

      <PriorityField control={control} id={`${prefix}-priority`} />
    </>
  );
}

function CategorySelectField({
  control,
  categories,
  id,
}: {
  control: Control<RuleInput>;
  categories: Category[];
  id: string;
}) {
  return (
    <Controller
      name="categoryId"
      control={control}
      render={({ field, fieldState }) => {
        const selectedCategory = categories.find((c) => c.id === field.value);
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>Kategoria docelowa</FieldLabel>
            <Select
              value={field.value > 0 ? String(field.value) : undefined}
              onValueChange={(value) => field.onChange(Number(value))}
            >
              <SelectTrigger id={id} className="w-full">
                <SelectValue placeholder="Wybierz kategorię">
                  {selectedCategory
                    ? `${selectedCategory.name} (${CATEGORY_TYPE_LABELS[selectedCategory.type]})`
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name} ({CATEGORY_TYPE_LABELS[category.type]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}

function RuleEnumSelectField<TName extends "matchType" | "target">({
  control,
  name,
  id,
  label,
  options,
  labels,
}: {
  control: Control<RuleInput>;
  name: TName;
  id: string;
  label: string;
  options: readonly RuleInput[TName][];
  labels: Record<RuleInput[TName], string>;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={id} className="w-full">
              <SelectValue>{labels[field.value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {labels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function PatternField({
  control,
  id,
}: {
  control: Control<RuleInput>;
  id: string;
}) {
  const matchType = useWatch({ control, name: "matchType" });

  return (
    <Controller
      name="pattern"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>Wzorzec</FieldLabel>
          <Input
            {...field}
            id={id}
            maxLength={255}
            placeholder={
              matchType === "REGEX" ? "np. ^UBER.*TRIP$" : "np. BIEDRONKA"
            }
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function PriorityField({
  control,
  id,
}: {
  control: Control<RuleInput>;
  id: string;
}) {
  // Keep raw text while editing so intermediate values like "" or "-" are not wiped out.
  const [draft, setDraft] = useState<{ value: number; text: string } | null>(
    null,
  );

  return (
    <Controller
      name="priority"
      control={control}
      render={({ field, fieldState }) => {
        const displayValue =
          draft !== null && Object.is(draft.value, field.value)
            ? draft.text
            : Number.isFinite(field.value)
              ? String(field.value)
              : "";

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>Priorytet</FieldLabel>
            <Input
              id={id}
              type="text"
              value={displayValue}
              onChange={(event) => {
                const nextText = event.target.value;
                const nextValue = parsePriorityInput(nextText);
                setDraft({ value: nextValue, text: nextText });
                field.onChange(nextValue);
              }}
              onBlur={() => {
                if (Number.isFinite(field.value)) {
                  setDraft(null);
                }
                field.onBlur();
              }}
              name={field.name}
              ref={field.ref}
              aria-invalid={fieldState.invalid}
            />
            <FieldDescription>
              Wyższa liczba oznacza wyższy priorytet dopasowania (domyślnie 0).
              Reguły własne mają pierwszeństwo przed systemowymi.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
