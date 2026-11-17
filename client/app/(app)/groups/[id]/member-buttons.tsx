"use client";

import { useRouter } from "next/navigation";

import { InlineError } from "@/components/inline-error";
import { Button } from "@/components/ui/button";
import { APP_PATHS } from "@/constants";
import { useServerAction } from "@/hooks/use-server-action";

import { removeMemberAction, settleSplitAction } from "./actions";

export function RemoveMemberButton({
  groupId,
  userId,
  displayName,
  isSelf,
}: {
  groupId: number;
  userId: number;
  displayName: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const { run, pending, error } = useServerAction();

  function onClick() {
    const question = isSelf
      ? "Opuścić tę grupę?"
      : `Usunąć ${displayName} z grupy?`;
    if (!window.confirm(question)) return;

    run(
      () => removeMemberAction(groupId, userId),
      () => {
        if (isSelf) router.push(APP_PATHS.groups);
      },
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <InlineError message={error} />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={onClick}
      >
        {isSelf ? "Opuść" : "Usuń"}
      </Button>
    </span>
  );
}

export function SettleButton({
  groupId,
  splitId,
}: {
  groupId: number;
  splitId: number;
}) {
  const { run, pending, error } = useServerAction();

  return (
    <span className="inline-flex items-center gap-2">
      <InlineError message={error} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(() => settleSplitAction(groupId, splitId))}
      >
        Rozlicz
      </Button>
    </span>
  );
}
