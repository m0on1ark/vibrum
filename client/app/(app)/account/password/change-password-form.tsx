"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { changePasswordAction } from "@/app/(app)/account/password/actions";
import { PasswordInput } from "@/components/auth/password-input";
import { useFormAction } from "@/hooks/use-form-action";
import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { APP_PATHS } from "@/constants";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/auth/schema";

export function ChangePasswordForm() {
  const [done, setDone] = useState(false);
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const { isSubmitting } = form.formState;

  const { submit, error } = useFormAction(
    (values: ChangePasswordInput) => changePasswordAction(values),
    () => {
      setDone(true);
    },
  );

  if (done) {
    return (
      <div className="grid gap-4">
        <Alert>
          <AlertDescription>
            Hasło zostało zmienione. Ze względów bezpieczeństwa wylogowaliśmy
            Cię ze wszystkich urządzeń.
          </AlertDescription>
        </Alert>
        <Button asChild size="lg" className="h-11 text-base">
          <Link href={APP_PATHS.signIn}>Zaloguj się ponownie</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <FieldGroup>
        <FormError message={error} />

        <Controller
          name="currentPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="change-password-current">
                Aktualne hasło
              </FieldLabel>
              <PasswordInput
                {...field}
                id="change-password-current"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          name="newPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="change-password-new">Nowe hasło</FieldLabel>
              <PasswordInput
                {...field}
                id="change-password-new"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                aria-describedby="change-password-hint"
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription id="change-password-hint">
                  Minimum 8 znaków.
                </FieldDescription>
              )}
            </Field>
          )}
        />

        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="change-password-confirm">
                Powtórz nowe hasło
              </FieldLabel>
              <PasswordInput
                {...field}
                id="change-password-confirm"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <SubmitButton pending={isSubmitting} pendingLabel="Zapisywanie…">
          Zmień hasło
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
