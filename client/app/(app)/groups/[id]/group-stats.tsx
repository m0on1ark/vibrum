import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/lib/shared/format";
import { cn } from "@/lib/utils";

import { balanceClass } from "./balance-class";

function Stat({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-semibold", className)}>{children}</p>
      </CardContent>
    </Card>
  );
}

export function GroupStats({
  myBalance,
  expenseCount,
  settlementCount,
}: {
  myBalance: number;
  expenseCount: number;
  settlementCount: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat title="Twoje saldo" className={balanceClass(myBalance)}>
        {myBalance > 0 ? "+" : ""}
        {formatAmount(myBalance)}
      </Stat>
      <Stat title="Wydatki">{expenseCount}</Stat>
      <Stat title="Do rozliczenia">{settlementCount}</Stat>
    </div>
  );
}
