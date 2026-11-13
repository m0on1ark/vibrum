"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { signUpAction } from "@/app/(auth)/auth/sign-up/actions";
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
import { Input } from "@/components/ui/input";
import { APP_PATHS } from "@/constants";
import { signUpSchema, type SignUpInput } from "@/lib/auth-schema";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(values: SignUpInput) {
    setError(null);
    try {
      const result = await signUpAction(values);
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
          Załóż konto
        </h1>
        <p className="text-muted-foreground">
          Miło Cię widzieć! Za chwilę będziesz mieć wyciągi, budżet i wydatki w
          jednym miejscu.
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
            name="displayName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sign-up-display-name">Imię</FieldLabel>
                <Input
                  {...field}
                  id="sign-up-display-name"
                  autoComplete="given-name"
                  placeholder="Jan"
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
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sign-up-email">Adres email</FieldLabel>
                <Input
                  {...field}
                  id="sign-up-email"
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
                <FieldLabel htmlFor="sign-up-password">Hasło</FieldLabel>
                <PasswordInput
                  {...field}
                  id="sign-up-password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  aria-describedby="sign-up-password-hint"
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription id="sign-up-password-hint">
                    Minimum 8 znaków.
                  </FieldDescription>
                )}
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
                Tworzenie konta…
              </>
            ) : (
              "Załóż konto"
            )}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-sm text-muted-foreground">
        Masz już konto?{" "}
        <Link
          href={APP_PATHS.signIn}
          className="font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
