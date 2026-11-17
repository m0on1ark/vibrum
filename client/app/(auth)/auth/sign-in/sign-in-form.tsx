"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { signInAction } from "@/app/(auth)/auth/sign-in/actions";
import { PasswordInput } from "@/components/auth/password-input";
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
import { signInSchema, type SignInInput } from "@/lib/auth/schema";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(values: SignInInput) {
    setError(null);
    try {
      const result = await signInAction(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.replace(APP_PATHS.home);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    }
  }

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Zaloguj się
        </h1>
        <p className="text-muted-foreground">
          Wróć do swoich wyciągów i budżetu.
        </p>
      </header>

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
                <FieldLabel htmlFor="sign-in-email">Adres email</FieldLabel>
                <Input
                  {...field}
                  id="sign-in-email"
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

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor="sign-in-password">Hasło</FieldLabel>
                  <Link
                    href={APP_PATHS.forgotPassword}
                    className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Nie pamiętasz hasła?
                  </Link>
                </div>
                <PasswordInput
                  {...field}
                  id="sign-in-password"
                  autoComplete="current-password"
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
                Logowanie…
              </>
            ) : (
              "Zaloguj się"
            )}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-sm text-muted-foreground">
        Nie masz jeszcze konta?{" "}
        <Link
          href={APP_PATHS.signUp}
          className="font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          Załóż konto
        </Link>
      </p>
    </div>
  );
}
