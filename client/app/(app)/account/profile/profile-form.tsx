"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { updateProfileAction } from "@/app/(app)/account/profile/actions";
import { CurrencyCombobox } from "@/components/currency-combobox";
import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CurrencyCode } from "@/constants/currencies";
import { useFormAction } from "@/hooks/use-form-action";
import {
  updateProfileSchema,
  type CurrentUser,
  type UpdateProfileInput,
} from "@/lib/auth/schema";

export function ProfileForm({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: user.displayName,
      baseCurrency: user.baseCurrency,
      iban: user.iban ?? "",
    },
  });
  const { isSubmitting } = form.formState;

  const { submit, error } = useFormAction(
    (values: UpdateProfileInput) => {
      setSaved(false);
      return updateProfileAction(values);
    },
    () => {
      setSaved(true);
      router.refresh();
    },
  );

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <FieldGroup>
        <FormError message={error} />

        {saved ? (
          <Alert>
            <AlertDescription>
              Zmiany w profilu zostały zapisane.
            </AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel htmlFor="profile-email">Adres e-mail</FieldLabel>
          <Input id="profile-email" value={user.email} readOnly disabled />
        </Field>

        <Controller
          name="displayName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-display-name">
                Nazwa wyświetlana
              </FieldLabel>
              <Input
                {...field}
                id="profile-display-name"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
                onChange={(event) => {
                  field.onChange(event);
                  setSaved(false);
                }}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="baseCurrency"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-base-currency">
                Waluta bazowa
              </FieldLabel>
              <CurrencyCombobox
                id="profile-base-currency"
                value={field.value as CurrencyCode}
                onChange={(value) => {
                  field.onChange(value);
                  setSaved(false);
                }}
              />
              <FieldDescription>
                Domyślna waluta dla nowych kont oraz waluta przeliczeniowa (wg
                kursu NBP) w całym serwisie.
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="iban"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-iban">
                Numer konta (IBAN)
              </FieldLabel>
              <Input
                {...field}
                id="profile-iban"
                placeholder="PL00 0000 0000 0000 0000 0000 0000"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
                onChange={(event) => {
                  field.onChange(event);
                  setSaved(false);
                }}
              />
              <FieldDescription>
                Polski numer IBAN (26 cyfr) do kodów QR w rozliczeniach
                grupowych. Pozostaw puste, aby usunąć.
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <SubmitButton pending={isSubmitting} pendingLabel="Zapisywanie…">
          Zapisz zmiany
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
