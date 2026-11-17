import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SPLIT_MODE_LABELS } from "@/constants";
import type { GroupExpense, GroupMember } from "@/lib/groups/types";
import { formatAmount, formatDate, formatMoney } from "@/lib/shared/format";

import { AddExpenseForm } from "./add-expense-form";
import { SettleButton } from "./member-buttons";

export function ExpensesTab({
  groupId,
  members,
  expenses,
  currentUserId,
}: {
  groupId: number;
  members: GroupMember[];
  expenses: GroupExpense[];
  currentUserId: number;
}) {
  return (
    <>
      <div className="flex justify-end">
        <AddExpenseForm groupId={groupId} members={members} />
      </div>
      {expenses.length === 0 ? (
        <p className="text-muted-foreground">
          Brak wydatków. Dodaj pierwszy przyciskiem powyżej.
        </p>
      ) : (
        expenses.map((expense) => (
          <Card key={expense.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <CardTitle>{expense.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {expense.paidByDisplayName} ·{" "}
                    {formatDate(expense.expenseDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {SPLIT_MODE_LABELS[expense.splitMode]}
                  </Badge>
                  <span className="font-semibold">
                    {formatMoney(expense.amount, expense.currency)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Osoba</TableHead>
                    <TableHead>Udział</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expense.splits.map((split) => (
                    <TableRow key={split.splitId}>
                      <TableCell>{split.displayName}</TableCell>
                      <TableCell>
                        {formatMoney(split.shareAmount, expense.currency)}
                        {split.sharePercent != null
                          ? ` (${formatAmount(split.sharePercent)}%)`
                          : ""}
                      </TableCell>
                      <TableCell>
                        {split.settled ? (
                          <Badge variant="secondary">Rozliczone</Badge>
                        ) : (
                          <Badge variant="outline">Do rozliczenia</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!split.settled &&
                        (split.userId === currentUserId ||
                          expense.paidById === currentUserId) ? (
                          <SettleButton
                            groupId={groupId}
                            splitId={split.splitId}
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </>
  );
}
