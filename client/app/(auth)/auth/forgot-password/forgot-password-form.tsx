"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { forgotPasswordAction } from "@/app/(auth)/auth/forgot-password/actions";
import { useFormAction } from "@/hooks/use-form-action";
import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { APP_PATHS } from "@/constants";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/auth/schema";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { isSubmitting } = form.formState;

  const { submit, error } = useFormAction(
    (values: ForgotPasswordInput) => forgotPasswordAction(values),
    (values) => {
      setSentTo(values.email);
    },
  );

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Nie pamiętasz hasła?
        </h1>
        <p className="text-muted-foreground">
          Podaj adres email, a wyślemy Ci link do ustawienia nowego hasła.
        </p>
      </header>

      {sentTo ? (
        <Alert>
          <AlertDescription>
            Jeśli konto z adresem {sentTo} istnieje, wysłaliśmy na nie link do
            zmiany hasła. Jest ważny przez 30 minut.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <FormError message={error} />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-password-email">
                    Adres email
                  </FieldLabel>
                  <Input
                    {...field}
                    id="forgot-password-email"
                    type="email"
                    autoComplete="email"
                    placeholder="jan@example.com"
                    className="h-11 text-base"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <SubmitButton pending={isSubmitting} pendingLabel="Wysyłanie…">
              Wyślij link
            </SubmitButton>
          </FieldGroup>
        </form>
      )}

      <p className="text-sm text-muted-foreground">
        Pamiętasz hasło?{" "}
        <Link
          href={APP_PATHS.signIn}
          className="font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          Wróć do logowania
        </Link>
      </p>
    </div>
  );
}
