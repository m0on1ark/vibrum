"use client";

import { useState } from "react";

import { NETWORK_ERROR_MESSAGE } from "@/constants";

export function useFormAction<TValues, TResult extends { error: string | null }>(
  action: (values: TValues) => Promise<TResult>,
  onSuccess?: (values: TValues, result: TResult) => void | Promise<void>,
) {
  const [error, setError] = useState<string | null>(null);

  async function submit(values: TValues) {
    setError(null);
    try {
      const result = await action(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      await onSuccess?.(values, result);
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
    }
  }

  return { submit, error, setError };
}
