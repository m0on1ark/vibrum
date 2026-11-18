"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { CurrencyCombobox } from "@/components/currency-combobox";
import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_CODES, type CurrencyCode } from "@/constants/currencies";
import { useFormAction } from "@/hooks/use-form-action";
import {
  createAccountSchema,
  type CreateAccountInput,
} from "@/lib/accounts/schema";
import { BANK_TYPE_LABELS, BANK_TYPES, type BankType } from "@/lib/accounts/types";

import { createAccountAction } from "./actions";

const BANK_OPTION_DESCRIPTIONS: Record<BankType, string> = {
  PKO_BP: "PKO BP (wyciąg CSV)",
  MBANK: "mBank (wyciąg CSV)",
  REVOLUT: "Revolut (wyciąg JSON)",
  MINIBANK: "miniBank (bez importu wyciągu)",
};

function resolveDefaultCurrency(code?: string): CurrencyCode {
  const normalized = code?.trim().toUpperCase();
  if (
    normalized &&
    (CURRENCY_CODES as readonly string[]).includes(normalized)
  ) {
    return normalized as CurrencyCode;
  }
  return "PLN";
}

export function CreateAccountForm({
  defaultCurrency,
}: {
  defaultCurrency?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const defaultValues: CreateAccountInput = {
    accountName: "",
    bankType: "PKO_BP",
    baseCurrency: resolveDefaultCurrency(defaultCurrency),
  };
  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues,
  });
  const { isSubmitting } = form.formState;

  const { submit, error, setError } = useFormAction(
    createAccountAction,
    () => {
      setOpen(false);
      form.reset(defaultValues);
      router.refresh();
    },
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    setError(null);
    form.reset(defaultValues);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-11 text-base">
          Dodaj konto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowe konto bankowe</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <FormError message={error} />

            <Controller
              name="accountName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="account-name">Nazwa konta</FieldLabel>
                  <Input
                    {...field}
                    id="account-name"
                    placeholder="Konto główne"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Controller
                name="bankType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="account-bank-type">Bank</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="account-bank-type" className="w-full">
                        <SelectValue>
                          {BANK_TYPE_LABELS[field.value]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {BANK_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {BANK_OPTION_DESCRIPTIONS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="baseCurrency"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="account-currency">
                      Waluta bazowa
                    </FieldLabel>
                    <CurrencyCombobox
                      id="account-currency"
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <SubmitButton pending={isSubmitting} pendingLabel="Tworzenie…">
              Utwórz konto
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
