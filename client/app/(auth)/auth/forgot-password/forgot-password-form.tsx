"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { forgotPasswordAction } from "@/app/(auth)/auth/forgot-password/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
} from "@/lib/auth-schema";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(values: ForgotPasswordInput) {
    setError(null);
    try {
      const result = await forgotPasswordAction(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSentTo(values.email);
    } catch {
      setError("Could not reach the server. Please try again.");
    }
  }

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
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

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

            <Button
              type="submit"
              size="lg"
              className="h-11 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Wysyłanie…
                </>
              ) : (
                "Wyślij link"
              )}
            </Button>
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
