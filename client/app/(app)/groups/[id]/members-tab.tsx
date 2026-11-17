import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GroupDetails } from "@/lib/groups/types";
import { formatDate } from "@/lib/shared/format";

import { InviteMemberForm } from "./invite-member-form";
import { RemoveMemberButton } from "./member-buttons";

export function MembersTab({
  group,
  currentUserId,
}: {
  group: GroupDetails;
  currentUserId: number;
}) {
  const isCreator = group.createdById === currentUserId;

  return (
    <>
      <InviteMemberForm groupId={group.id} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Osoba</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Dołączył(a)</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {group.members.map((member) => {
            const canRemove =
              member.userId !== group.createdById &&
              (isCreator || member.userId === currentUserId);
            return (
              <TableRow key={member.userId}>
                <TableCell>
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {member.displayName}
                    {member.userId === group.createdById ? (
                      <Badge variant="secondary">Założyciel</Badge>
                    ) : null}
                    {member.userId === currentUserId ? (
                      <Badge variant="outline">Ty</Badge>
                    ) : null}
                  </span>
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{formatDate(member.joinedAt)}</TableCell>
                <TableCell className="text-right">
                  {canRemove ? (
                    <RemoveMemberButton
                      groupId={group.id}
                      userId={member.userId}
                      displayName={member.displayName}
                      isSelf={member.userId === currentUserId}
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
