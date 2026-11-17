"use client";

import { RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FormError } from "@/components/form-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { NETWORK_ERROR_MESSAGE } from "@/constants";
import { pluralPl } from "@/lib/shared/plural";
import type { RecategorizeResult } from "@/lib/transactions/types";

import { recategorizeTransactionsAction } from "./actions";

export function RecategorizeControl() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecategorizeResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const response = await recategorizeTransactionsAction();
        if (response.error) {
          setError(response.error);
          return;
        }
        setResult(response.result);
        router.refresh();
      } catch {
        setError(NETWORK_ERROR_MESSAGE);
      }
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Automatyczna kategoryzacja pomija transakcje ze zmianą ręczną.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={handleClick}
        >
          <RefreshCwIcon className={pending ? "size-3.5 animate-spin" : "size-3.5"} />
          {pending ? "Kategoryzowanie…" : "Kategoryzuj ponownie"}
        </Button>
      </div>

      <FormError message={error} />

      {result ? (
        <Alert>
          <AlertDescription>
            Sprawdzono {result.checkedCount}{" "}
            {pluralPl(
              result.checkedCount,
              "transakcję",
              "transakcje",
              "transakcji",
            )}
            , zmieniono kategorię w {result.changedCount}{" "}
            {pluralPl(
              result.changedCount,
              "przypadku",
              "przypadkach",
              "przypadkach",
            )}
            .
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
