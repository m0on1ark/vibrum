import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/shared/format";
import { pluralPl } from "@/lib/shared/plural";
import type { SubscriptionTotal } from "@/lib/subscriptions/types";

export function SubscriptionSummaryCards({
  totals,
}: {
  totals: SubscriptionTotal[];
}) {
  if (totals.length === 0) return null;

  return (
    <section
      aria-label="Podsumowanie kosztów subskrypcji"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {totals.map((item) => (
        <Card key={item.currency}>
          <CardHeader>
            <CardTitle>{item.currency}</CardTitle>
            <CardDescription>
              {item.count}{" "}
              {pluralPl(
                item.count,
                "aktywna subskrypcja",
                "aktywne subskrypcje",
                "aktywnych subskrypcji",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">
                Koszt miesięczny
              </span>
              <span className="text-xl font-semibold tabular-nums">
                {formatMoney(item.monthlyCost, item.currency)}
              </span>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">
                Koszt roczny
              </span>
              <span className="text-xl font-semibold tabular-nums">
                {formatMoney(item.yearlyCost, item.currency)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
