import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MemberBalance } from "@/lib/groups/types";
import { formatAmount } from "@/lib/shared/format";
import { cn } from "@/lib/utils";

import { balanceClass } from "./balance-class";

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
          <TableHead className="text-right">Saldo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {balances.map((balance) => (
          <TableRow key={balance.userId}>
            <TableCell>
              {balance.displayName}
              {balance.userId === currentUserId ? " (Ty)" : ""}
            </TableCell>
            <TableCell>{balance.email}</TableCell>
            <TableCell
              className={cn(
                "text-right font-medium",
                balanceClass(balance.netBalance),
              )}
            >
              {balance.netBalance > 0 ? "+" : ""}
              {formatAmount(balance.netBalance)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
