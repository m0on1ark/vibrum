import { Bell } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

import { APP_PATHS } from "@/constants";
import { API_PATHS, apiUrl } from "@/constants/api-paths";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth } from "@/lib/shared/fetch-with-auth";
import {
  isInvitationActive,
  type GroupInvitation,
} from "@/lib/groups/types";

export async function NotificationsBell() {
  await connection();
  let pending = 0;
  try {
    const response = await fetchWithAuth(apiUrl(API_PATHS.invitations.root));
    if (response.ok) {
      const invitations = (await response.json()) as GroupInvitation[];
      pending = invitations.filter((i) => isInvitationActive(i)).length;
    }
  } catch {
    pending = 0;
  }

  return (
    <Link
      href={APP_PATHS.notifications}
      aria-label={
        pending > 0
          ? `Powiadomienia (${pending} oczekujących)`
          : "Powiadomienia"
      }
      className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <Bell className="size-5" />
      {pending > 0 ? (
        <Badge className="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 text-[11px]">
          {pending}
        </Badge>
      ) : null}
    </Link>
  );
}
