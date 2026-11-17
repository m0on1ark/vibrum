import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MemberBalance } from "@/lib/groups/types";
import { formatMoney } from "@/lib/shared/format";
import { cn } from "@/lib/utils";

import { balanceClass } from "./balance-class";

function statusLabel(balance: number, isMe: boolean) {
  if (balance > 0) {
    return isMe ? "Inni są Ci winni" : "Otrzyma zwrot";
  }
  if (balance < 0) {
    return isMe ? "Do zapłaty" : "Ma dług";
  }
  return "Na zero";
}

export function BalancesTab({
  balances,
  currentUserId,
}: {
  balances: MemberBalance[];
  currentUserId: number;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Osoba</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {balances.map((balance) => {
          const isMe = balance.userId === currentUserId;
          return (
            <TableRow key={balance.userId}>
              <TableCell>
                <span className="inline-flex flex-wrap items-center gap-2">
                  {balance.displayName}
                  {isMe ? <Badge variant="outline">Ty</Badge> : null}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {balance.email}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {statusLabel(balance.netBalance, isMe)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium",
                  balanceClass(balance.netBalance),
                )}
              >
                {balance.netBalance > 0 ? "+" : ""}
                {formatMoney(balance.netBalance, "PLN")}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
