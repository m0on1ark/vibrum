import { connection } from "next/server";
import { Suspense } from "react";

import { API_PATHS } from "@/constants/api-paths";
import { LoadError } from "@/components/load-error";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isInvitationActive,
  type GroupInvitation,
} from "@/lib/groups/types";
import { formatDate } from "@/lib/shared/format";
import { getJson } from "@/lib/shared/get-json";

import { InvitationButtons } from "./invitation-buttons";

export default function NotificationsPage() {
  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Powiadomienia
        </h1>
        <p className="text-muted-foreground">
          Zaproszenia do grup oczekujące na Twoją decyzję.
        </p>
      </header>

      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <InvitationsList />
      </Suspense>
    </div>
  );
}

async function InvitationsList() {
  await connection();
  const all = await getJson<GroupInvitation[]>(API_PATHS.invitations.root);
  if (!all) return <LoadError subject="notifications" />;

  const invitations = all.filter((invitation) =>
    isInvitationActive(invitation),
  );

  if (invitations.length === 0) {
    return (
      <p className="text-muted-foreground">Brak powiadomień.</p>
    );
  }

  return (
    <div className="grid gap-3">
      {invitations.map((invitation) => (
        <Card key={invitation.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div className="grid gap-1">
              <p>
                <strong>{invitation.invitedByDisplayName}</strong> zaprasza
                Cię do grupy <strong>{invitation.groupName}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(invitation.createdAt)}
                {invitation.expiresAt
                  ? ` · ważne do ${formatDate(invitation.expiresAt)}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">Oczekuje</Badge>
              <InvitationButtons
                invitationId={invitation.id}
                groupId={invitation.groupId}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
