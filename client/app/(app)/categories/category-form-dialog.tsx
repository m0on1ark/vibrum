"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
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
import { useFormAction } from "@/hooks/use-form-action";
import { categorySchema, type CategoryInput } from "@/lib/categories/schema";
import {
  CATEGORY_TYPE_LABELS,
  CATEGORY_TYPES,
  type Category,
} from "@/lib/categories/types";

import { createCategoryAction, updateCategoryAction } from "./actions";

export function CategoryFormDialog({
  category,
  trigger,
}: {
  category?: Category;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = category !== undefined;

  const defaultValues: CategoryInput = {
    name: category?.name ?? "",
    type: category?.type ?? "EXPENSE",
  };

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });
  const { isSubmitting } = form.formState;

  const { submit, error, setError } = useFormAction(
    (values: CategoryInput) =>
      isEdit
        ? updateCategoryAction(category.id, values)
        : createCategoryAction(values),
    () => {
      setOpen(false);
      router.refresh();
    },
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setError(null);
      form.reset({
        name: category?.name ?? "",
        type: category?.type ?? "EXPENSE",
      });
    }
  }

  const nameId = isEdit ? `category-name-${category.id}` : "category-name-new";
  const typeId = isEdit ? `category-type-${category.id}` : "category-type-new";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edytuj kategorię" : "Nowa kategoria"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <FormError message={error} />

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={nameId}>Nazwa kategorii</FieldLabel>
                  <Input
                    {...field}
                    id={nameId}
                    maxLength={100}
                    placeholder="np. Kawa i przekąski"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="type"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={typeId}>Typ</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={typeId} className="w-full">
                      <SelectValue>
                        {CATEGORY_TYPE_LABELS[field.value]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {CATEGORY_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="mt-6">
            <SubmitButton
              pending={isSubmitting}
              pendingLabel={isEdit ? "Zapisywanie…" : "Tworzenie…"}
            >
              {isEdit ? "Zapisz zmiany" : "Utwórz kategorię"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
