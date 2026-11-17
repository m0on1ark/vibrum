"use client";

import { useRouter } from "next/navigation";

import { InlineError } from "@/components/inline-error";
import { Button } from "@/components/ui/button";
import { APP_PATHS } from "@/constants";
import { useServerAction } from "@/hooks/use-server-action";

import { acceptInvitationAction, declineInvitationAction } from "./actions";

export function InvitationButtons({
  invitationId,
  groupId,
}: {
  invitationId: number;
  groupId: number;
}) {
  const router = useRouter();
  const { run, pending, error } = useServerAction();

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <InlineError message={error} />
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() =>
          run(
            () => acceptInvitationAction(invitationId),
            () => router.push(`${APP_PATHS.groups}/${groupId}`),
          )
        }
      >
        Przyjmij
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(() => declineInvitationAction(invitationId))}
      >
        Odrzuć
      </Button>
    </span>
  );
}
