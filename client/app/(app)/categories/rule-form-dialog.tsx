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
import { FieldGroup } from "@/components/ui/field";
import { useFormAction } from "@/hooks/use-form-action";
import { ruleSchema, type RuleInput } from "@/lib/categories/schema";
import type { CategorizationRule, Category } from "@/lib/categories/types";

import { createRuleAction, updateRuleAction } from "./actions";
import { RuleFormFields } from "./rule-form-fields";

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
            <RuleFormFields
              control={form.control}
              categories={categories}
              prefix={prefix}
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
