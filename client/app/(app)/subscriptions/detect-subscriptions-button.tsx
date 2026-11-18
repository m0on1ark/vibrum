"use client";

import { RefreshCwIcon } from "lucide-react";

import { InlineError } from "@/components/inline-error";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { cn } from "@/lib/utils";

import { detectSubscriptionsAction } from "./actions";

export function DetectSubscriptionsButton() {
  const { run, pending, error } = useServerAction();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        disabled={pending}
        onClick={() => run(detectSubscriptionsAction)}
      >
        <RefreshCwIcon className={cn("size-4", pending && "animate-spin")} />
        {pending ? "Wykrywanie…" : "Wykryj subskrypcje"}
      </Button>
      <InlineError message={error} />
    </div>
  );
}
