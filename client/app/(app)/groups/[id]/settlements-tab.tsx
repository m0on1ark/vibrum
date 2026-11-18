import { ArrowRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SettlementTransfer } from "@/lib/groups/types";
import { formatMoney } from "@/lib/shared/format";
import { cn } from "@/lib/utils";

import { SettlementPaymentDialog } from "./settlement-payment-dialog";

export function SettlementsTab({
  groupId,
  settlements,
  currentUserId,
}: {
  groupId: number;
  settlements: SettlementTransfer[];
  currentUserId: number;
}) {
  if (settlements.length === 0) {
    return (
      <p className="text-muted-foreground">
        Brak zaległych rozliczeń. Wszystko uregulowane.
      </p>
    );
  }

  return settlements.map((transfer) => {
    const iOwe = transfer.fromUserId === currentUserId;
    const owedToMe = transfer.toUserId === currentUserId;

    return (
      <Card
        key={`${transfer.fromUserId}-${transfer.toUserId}`}
        className={cn((iOwe || owedToMe) && "border-foreground/25")}
      >
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <strong>
                {transfer.fromDisplayName}
                {iOwe ? " (Ty)" : ""}
              </strong>
              <ArrowRightIcon className="size-4 text-muted-foreground" />
              <strong>
                {transfer.toDisplayName}
                {owedToMe ? " (Ty)" : ""}
              </strong>
              {iOwe ? (
                <Badge variant="destructive">Musisz przelać</Badge>
              ) : owedToMe ? (
                <Badge variant="secondary">Otrzymasz zwrot</Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {iOwe
                ? `Przelej tę kwotę użytkownikowi ${transfer.toDisplayName}`
                : owedToMe
                  ? `${transfer.fromDisplayName} powinien(-na) przelać Ci tę kwotę`
                  : `${transfer.fromDisplayName} oddaje użytkownikowi ${transfer.toDisplayName}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {iOwe ? (
              <SettlementPaymentDialog groupId={groupId} transfer={transfer} />
            ) : null}
            <span
              className={cn(
                "text-lg font-semibold",
                iOwe && "text-destructive",
                owedToMe && "text-emerald-600",
              )}
            >
              {formatMoney(transfer.amount, "PLN")}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  });
}
