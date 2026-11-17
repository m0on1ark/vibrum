import { Card, CardContent } from "@/components/ui/card";
import type { SettlementTransfer } from "@/lib/groups/types";
import { formatAmount } from "@/lib/shared/format";

export function SettlementsTab({
  settlements,
}: {
  settlements: SettlementTransfer[];
}) {
  if (settlements.length === 0) {
    return (
      <p className="text-muted-foreground">
        Brak zaległych rozliczeń. Wszystko uregulowane.
      </p>
    );
  }

  return settlements.map((transfer) => (
    <Card key={`${transfer.fromUserId}-${transfer.toUserId}`}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
        <span>
          <strong>{transfer.fromDisplayName}</strong>
          {" → "}
          <strong>{transfer.toDisplayName}</strong>
        </span>
        <span className="font-semibold">{formatAmount(transfer.amount)}</span>
      </CardContent>
    </Card>
  ));
}
