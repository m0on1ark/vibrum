"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useFormAction } from "@/hooks/use-form-action";
import { FormError } from "@/components/form-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  inviteMemberSchema,
  type InviteMemberInput,
} from "@/lib/groups/schema";

import { inviteMemberAction } from "./actions";

export function InviteMemberForm({ groupId }: { groupId: number }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "" },
  });
  const { isSubmitting } = form.formState;

  const { submit, error } = useFormAction(
    (values: InviteMemberInput) => inviteMemberAction(groupId, values),
    (values) => {
      setSentTo(values.email);
      form.reset();
    },
  );

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      noValidate
      className="grid gap-3"
    >
      <FormError message={error} />
      {sentTo ? (
        <Alert>
          <AlertDescription>
            Wysłano zaproszenie na adres {sentTo}. Uczestnik dołączy po jego
            przyjęciu.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="min-w-56 flex-1"
            >
              <FieldLabel htmlFor="invite-email">
                Zaproś uczestnika po adresie email
              </FieldLabel>
              <Input
                {...field}
                id="invite-email"
                type="email"
                placeholder="jan@example.com"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          Zaproś
        </Button>
      </div>
    </form>
  );
}
