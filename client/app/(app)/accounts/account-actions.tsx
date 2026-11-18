"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormError } from "@/components/form-error";
import { InlineError } from "@/components/inline-error";
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
import { useFormAction } from "@/hooks/use-form-action";
import { useServerAction } from "@/hooks/use-server-action";
import {
  renameAccountSchema,
  type RenameAccountInput,
} from "@/lib/accounts/schema";

import { deleteAccountAction, renameAccountAction } from "./actions";

export function AccountActions({
  accountId,
  accountName,
}: {
  accountId: number;
  accountName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hideDeleteError, setHideDeleteError] = useState(false);
  const {
    run: runDelete,
    pending: deleting,
    error: deleteError,
  } = useServerAction();

  const form = useForm<RenameAccountInput>({
    resolver: zodResolver(renameAccountSchema),
    defaultValues: { accountName },
  });
  const { isSubmitting } = form.formState;

  const {
    submit: submitRename,
    error: renameError,
    setError: setRenameError,
  } = useFormAction(
    (values: RenameAccountInput) => renameAccountAction(accountId, values),
    () => {
      setHideDeleteError(true);
      setOpen(false);
      router.refresh();
    },
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    setHideDeleteError(true);
    if (nextOpen) {
      setRenameError(null);
      form.reset({ accountName });
    }
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Usunąć konto „${accountName}” wraz ze wszystkimi jego transakcjami?`,
      )
    ) {
      return;
    }
    setHideDeleteError(false);
    runDelete(() => deleteAccountAction(accountId));
  }

  const inputId = `rename-account-${accountId}`;
  const visibleDeleteError = hideDeleteError ? null : deleteError;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <InlineError message={visibleDeleteError} />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" disabled={deleting}>
            <PencilIcon className="size-3.5" />
            Zmień nazwę
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień nazwę konta</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(submitRename)} noValidate>
            <FieldGroup>
              <FormError message={renameError} />
              <Controller
                name="accountName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={inputId}>Nazwa konta</FieldLabel>
                    <Input
                      {...field}
                      id={inputId}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter className="mt-6">
              <SubmitButton
                pending={isSubmitting}
                pendingLabel="Zapisywanie…"
              >
                Zapisz
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={deleting}
        onClick={handleDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2Icon className="size-3.5" />
        Usuń
      </Button>
    </div>
  );
}
