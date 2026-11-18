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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormAction } from "@/hooks/use-form-action";
import { ruleSchema, type RuleInput } from "@/lib/categories/schema";
import {
  CATEGORY_TYPE_LABELS,
  RULE_MATCH_TYPE_LABELS,
  RULE_MATCH_TYPES,
  RULE_TARGET_LABELS,
  RULE_TARGETS,
  type CategorizationRule,
  type Category,
} from "@/lib/categories/types";

import { createRuleAction, updateRuleAction } from "./actions";

export function RuleFormDialog({
  rule,
  categories,
  trigger,
}: {
  rule?: CategorizationRule;
  categories: Category[];
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = rule !== undefined;

  function buildDefaults(): RuleInput {
    return {
      categoryId: rule?.categoryId ?? categories[0]?.id ?? 0,
      matchType: rule?.matchType ?? "KEYWORD",
      target: rule?.target ?? "ANY",
      pattern: rule?.pattern ?? "",
      priority: rule?.priority ?? 0,
    };
  }

  const form = useForm<RuleInput>({
    resolver: zodResolver(ruleSchema),
    defaultValues: buildDefaults(),
  });
  const { isSubmitting } = form.formState;
  const matchType = useWatch({ control: form.control, name: "matchType" });

  const { submit, error, setError } = useFormAction(
    (values: RuleInput) =>
      isEdit ? updateRuleAction(rule.id, values) : createRuleAction(values),
    () => {
      setOpen(false);
      router.refresh();
    },
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setError(null);
      form.reset(buildDefaults());
    }
  }

  const prefix = isEdit ? `rule-${rule.id}` : "rule-new";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edytuj regułę kategoryzacji" : "Nowa reguła kategoryzacji"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <FormError message={error} />

            <Controller
              name="categoryId"
              control={form.control}
              render={({ field, fieldState }) => {
                const selectedCategory = categories.find(
                  (c) => c.id === field.value,
                );
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${prefix}-category`}>
                      Kategoria docelowa
                    </FieldLabel>
                    <Select
                      value={field.value > 0 ? String(field.value) : undefined}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger
                        id={`${prefix}-category`}
                        className="w-full"
                      >
                        <SelectValue placeholder="Wybierz kategorię">
                          {selectedCategory
                            ? `${selectedCategory.name} (${CATEGORY_TYPE_LABELS[selectedCategory.type]})`
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={String(category.id)}
                          >
                            {category.name} (
                            {CATEGORY_TYPE_LABELS[category.type]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                );
              }}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Controller
                name="matchType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${prefix}-match-type`}>
                      Typ dopasowania
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id={`${prefix}-match-type`}
                        className="w-full"
                      >
                        <SelectValue>
                          {RULE_MATCH_TYPE_LABELS[field.value]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {RULE_MATCH_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {RULE_MATCH_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="target"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${prefix}-target`}>
                      Dopasuj w polu
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id={`${prefix}-target`}
                        className="w-full"
                      >
                        <SelectValue>
                          {RULE_TARGET_LABELS[field.value]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {RULE_TARGETS.map((target) => (
                          <SelectItem key={target} value={target}>
                            {RULE_TARGET_LABELS[target]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <Controller
              name="pattern"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${prefix}-pattern`}>Wzorzec</FieldLabel>
                  <Input
                    {...field}
                    id={`${prefix}-pattern`}
                    maxLength={255}
                    placeholder={
                      matchType === "REGEX"
                        ? "np. ^UBER.*TRIP$"
                        : "np. BIEDRONKA"
                    }
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="priority"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${prefix}-priority`}>
                    Priorytet
                  </FieldLabel>
                  <Input
                    id={`${prefix}-priority`}
                    type="number"
                    step={1}
                    value={Number.isFinite(field.value) ? String(field.value) : ""}
                    onChange={(event) => {
                      const raw = event.target.value;
                      field.onChange(raw === "" ? Number.NaN : Number(raw));
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    Wyższa liczba oznacza wyższy priorytet dopasowania (domyślnie
                    0). Reguły własne mają pierwszeństwo przed systemowymi.
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="mt-6">
            <SubmitButton
              pending={isSubmitting}
              pendingLabel={isEdit ? "Zapisywanie…" : "Tworzenie…"}
            >
              {isEdit ? "Zapisz zmiany" : "Utwórz regułę"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
