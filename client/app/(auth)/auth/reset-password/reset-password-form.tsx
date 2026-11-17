"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { resetPasswordAction } from "@/app/(auth)/auth/reset-password/actions";
import { PasswordInput } from "@/components/auth/password-input";
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
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/auth/schema";

export function ResetPasswordForm({ token }: { token: string | undefined }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(values: ResetPasswordInput) {
    setError(null);
    try {
      const result = await resetPasswordAction(token ?? "", values);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    }
  }

  if (!token) {
    return (
      <div className="grid gap-8">
        <header className="grid gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Invalid link
          </h1>
          <p className="text-muted-foreground">
            This link is missing a token. Request a new one to set your password.
          </p>
        </header>
        <Button asChild size="lg" className="h-11 text-base">
          <Link href={APP_PATHS.forgotPassword}>Wyślij nowy link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Ustaw nowe hasło
        </h1>
        <p className="text-muted-foreground">
          Wybierz hasło, którego jeszcze nie używałeś(-aś) w innych miejscach.
        </p>
      </header>

      {done ? (
        <div className="grid gap-4">
          <Alert>
            <AlertDescription>
              Hasło zostało zmienione. Zaloguj się nowym hasłem.
            </AlertDescription>
          </Alert>
          <Button asChild size="lg" className="h-11 text-base">
            <Link href={APP_PATHS.signIn}>Przejdź do logowania</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}{" "}
                  <Link href={APP_PATHS.forgotPassword}>
                    Poproś o nowy link.
                  </Link>
                </AlertDescription>
              </Alert>
            ) : null}

            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password-new">Nowe hasło</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="reset-password-new"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    aria-describedby="reset-password-hint"
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription id="reset-password-hint">
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
                  <FieldLabel htmlFor="reset-password-confirm">
                    Powtórz hasło
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id="reset-password-confirm"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="h-11 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Zapisywanie…
                </>
              ) : (
                "Zapisz hasło"
              )}
            </Button>
          </FieldGroup>
        </form>
      )}
    </div>
  );
}
