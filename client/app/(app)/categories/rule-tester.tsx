"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, FlaskConicalIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useFormAction } from "@/hooks/use-form-action";
import { testRuleSchema, type TestRuleInput } from "@/lib/categories/schema";
import {
  CATEGORY_TYPE_LABELS,
  RULE_MATCH_TYPE_LABELS,
  RULE_TARGET_LABELS,
  type CategorizationTestResult,
} from "@/lib/categories/types";

import { testRuleAction } from "./actions";

export function RuleTester() {
  const [testResult, setTestResult] = useState<CategorizationTestResult | null>(
    null,
  );

  const form = useForm<TestRuleInput>({
    resolver: zodResolver(testRuleSchema),
    defaultValues: { title: "", counterparty: "" },
  });
  const { isSubmitting } = form.formState;

  const { submit, error } = useFormAction(
    async (values: TestRuleInput) => {
      setTestResult(null);
      return testRuleAction(values);
    },
    (_values, response) => {
      setTestResult(response.result);
    },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConicalIcon className="size-4" />
          Testuj regułę
        </CardTitle>
        <CardDescription>
          Sprawdź, która kategoria i reguła dopasują się do podanego tytułu lub
          odbiorcy transakcji.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <FormError message={error} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rule-test-title">
                      Tytuł transakcji
                    </FieldLabel>
                    <Input
                      {...field}
                      id="rule-test-title"
                      maxLength={500}
                      placeholder="np. Płatność kartą BIEDRONKA"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="counterparty"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rule-test-counterparty">
                      Odbiorca / kontrahent
                    </FieldLabel>
                    <Input
                      {...field}
                      id="rule-test-counterparty"
                      maxLength={500}
                      placeholder="np. Jeronimo Martins Polska"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <div className="flex justify-end">
              <SubmitButton pending={isSubmitting} pendingLabel="Testowanie…">
                Testuj regułę
              </SubmitButton>
            </div>
          </FieldGroup>
        </form>

        {testResult ? (
          testResult.matched && testResult.category && testResult.rule ? (
            <Alert>
              <CheckCircle2Icon className="size-4 text-emerald-600" />
              <AlertTitle className="flex flex-wrap items-center gap-2">
                <span>Dopasowana kategoria: {testResult.category.name}</span>
                <Badge
                  variant={
                    testResult.category.type === "INCOME"
                      ? "default"
                      : "secondary"
                  }
                >
                  {CATEGORY_TYPE_LABELS[testResult.category.type]}
                </Badge>
                <Badge variant="outline">
                  {testResult.category.system ? "Systemowa" : "Własna"}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-1 grid gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span>Dopasowana reguła:</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                    {testResult.rule.pattern}
                  </code>
                  <Badge variant="secondary">
                    {RULE_MATCH_TYPE_LABELS[testResult.rule.matchType]}
                  </Badge>
                  <Badge variant="outline">
                    {RULE_TARGET_LABELS[testResult.rule.target]}
                  </Badge>
                  <span>Priorytet: {testResult.rule.priority}</span>
                  <span>
                    ({testResult.rule.system ? "systemowa" : "własna"})
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <XCircleIcon className="size-4 text-muted-foreground" />
              <AlertTitle>Brak dopasowania</AlertTitle>
              <AlertDescription>
                Żadna aktywna reguła nie pasuje do podanego tytułu ani odbiorcy.
              </AlertDescription>
            </Alert>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
