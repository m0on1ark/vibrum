"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { signUpAction } from "@/app/(auth)/auth/sign-up/actions";
import { PasswordInput } from "@/components/auth/password-input";
import { useFormAction } from "@/hooks/use-form-action";
import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { APP_PATHS } from "@/constants";
import { signUpSchema, type SignUpInput } from "@/lib/auth/schema";

export function SignUpForm() {
  const router = useRouter();
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });
  const { isSubmitting } = form.formState;

  const { submit, error } = useFormAction(
    (values: SignUpInput) => signUpAction(values),
    () => {
      router.replace(APP_PATHS.home);
      router.refresh();
    },
  );

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

      <form onSubmit={form.handleSubmit(submit)} noValidate>
        <FieldGroup>
          <FormError message={error} />

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

          <SubmitButton pending={isSubmitting} pendingLabel="Tworzenie konta…">
            Załóż konto
          </SubmitButton>
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
