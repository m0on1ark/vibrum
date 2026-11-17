import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

export function SubmitButton({
  pending,
  pendingLabel,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "type" | "disabled"> & {
  pending: boolean;
  pendingLabel: string;
}) {
  return (
    <Button
      type="submit"
      size="lg"
      className="h-11 text-base"
      disabled={pending}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
