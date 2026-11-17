"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { NETWORK_ERROR_MESSAGE } from "@/constants";

export function useServerAction() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(
    action: () => Promise<{ error: string | null }>,
    onSuccess?: () => void,
  ) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.error) {
          setError(result.error);
          return;
        }
        onSuccess?.();
        router.refresh();
      } catch {
        setError(NETWORK_ERROR_MESSAGE);
      }
    });
  }

  return { run, pending, error };
}
