import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/shared/format";
import { cn } from "@/lib/utils";

import { balanceClass } from "./balance-class";

function Stat({
  title,
  hint,
  className,
  children,
}: {
  title: string;
  hint?: string;
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
      <CardContent className="grid gap-1">
        <p className={cn("text-2xl font-semibold", className)}>{children}</p>
        {hint ? <CardDescription>{hint}</CardDescription> : null}
      </CardContent>
    </Card>
  );
}

function balanceHint(value: number) {
  if (value > 0) return "Inni są Ci winni";
  if (value < 0) return "Ty jesteś winien(-na) innym";
  return "Jesteś na zero";
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
      <Stat
        title="Twoje saldo"
        hint={balanceHint(myBalance)}
        className={balanceClass(myBalance)}
      >
        {myBalance > 0 ? "+" : ""}
        {formatMoney(myBalance, "PLN")}
      </Stat>
      <Stat title="Wydatki">{expenseCount}</Stat>
      <Stat
        title="Przelewy do wykonania"
        hint={
          settlementCount === 0
            ? "Wszystko rozliczone"
            : "Aby wyjść na zero"
        }
      >
        {settlementCount}
      </Stat>
    </div>
  );
}
