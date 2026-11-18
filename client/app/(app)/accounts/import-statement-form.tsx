"use client";

import { UploadIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { APP_PATHS, NETWORK_ERROR_MESSAGE } from "@/constants";
import { validateStatementFile } from "@/lib/accounts/schema";
import {
  IMPORT_FORMAT_META,
  type BankType,
  type ImportResult,
} from "@/lib/accounts/types";
import { pluralPl } from "@/lib/shared/plural";

import { importStatementAction } from "./actions";

export function ImportStatementForm({
  accountId,
  bankType,
}: {
  accountId: number;
  bankType: BankType;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  const formatMeta = IMPORT_FORMAT_META[bankType];
  if (!formatMeta) {
    return (
      <p className="text-sm text-muted-foreground">
        Import wyciągów nie jest obsługiwany dla kont miniBank (obsługiwane:
        PKO BP CSV, mBank CSV, Revolut CSV / JSON).
      </p>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const fileError = validateStatementFile(selectedFile);
    if (fileError || !selectedFile) {
      setError(fileError ?? "Select a non-empty file to import");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    startTransition(async () => {
      try {
        const response = await importStatementAction(accountId, formData);
        if (response.error) {
          setError(response.error);
          return;
        }
        setResult(response.result);
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } catch {
        setError(NETWORK_ERROR_MESSAGE);
      }
    });
  }

  const inputId = `import-file-${accountId}`;

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <FormError message={error} />

      {result ? (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Zaimportowano {result.importedCount}{" "}
              {pluralPl(
                result.importedCount,
                "transakcję",
                "transakcje",
                "transakcji",
              )}
              {result.skippedDuplicatesCount > 0
                ? `, pominięto ${result.skippedDuplicatesCount} ${pluralPl(
                    result.skippedDuplicatesCount,
                    "duplikat",
                    "duplikaty",
                    "duplikatów",
                  )}`
                : ""}
              .
            </span>
            <Link
              href={`${APP_PATHS.transactions}?accountId=${accountId}`}
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              Zobacz transakcje
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <Field>
        <FieldLabel htmlFor={inputId}>
          Importuj wyciąg ({formatMeta.label})
        </FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            ref={inputRef}
            id={inputId}
            name="file"
            type="file"
            accept={formatMeta.accept}
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              setError(null);
              setResult(null);
            }}
          />
          <SubmitButton
            pending={pending}
            pendingLabel="Importowanie…"
            size="default"
            className="h-8 shrink-0 text-sm"
          >
            <UploadIcon className="size-4" />
            Importuj
          </SubmitButton>
        </div>
        {formatMeta.hint ? (
          <FieldDescription>{formatMeta.hint}</FieldDescription>
        ) : null}
      </Field>
    </form>
  );
}
