import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type BaseCurrencyContext,
  DEFAULT_BASE_CURRENCY_CTX,
  formatOriginalPln,
  formatPrimaryFromPln,
} from "@/lib/currencies/base-currency";
import { formatMoney } from "@/lib/shared/format";
import { pluralPl } from "@/lib/shared/plural";
import type { SubscriptionTotal } from "@/lib/subscriptions/types";

export function SubscriptionSummaryCards({
  totals,
  baseCurrencyCtx = DEFAULT_BASE_CURRENCY_CTX,
}: {
  totals: SubscriptionTotal[];
  baseCurrencyCtx?: BaseCurrencyContext;
}) {
  if (totals.length === 0) return null;

  return (
    <section
      aria-label="Podsumowanie kosztów subskrypcji"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {totals.map((item) => {
        const isConvertedPln =
          item.currency === "PLN" && baseCurrencyCtx.baseCurrency !== "PLN";
        const monthlyPrimary = isConvertedPln
          ? formatPrimaryFromPln(item.monthlyCost, baseCurrencyCtx)
          : formatMoney(item.monthlyCost, item.currency);
        const monthlyOrig = isConvertedPln
          ? formatOriginalPln(item.monthlyCost, baseCurrencyCtx)
          : null;
        const yearlyPrimary = isConvertedPln
          ? formatPrimaryFromPln(item.yearlyCost, baseCurrencyCtx)
          : formatMoney(item.yearlyCost, item.currency);
        const yearlyOrig = isConvertedPln
          ? formatOriginalPln(item.yearlyCost, baseCurrencyCtx)
          : null;

        return (
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
                  {monthlyPrimary}
                </span>
                {monthlyOrig ? (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {monthlyOrig}
                  </span>
                ) : null}
              </div>
              <div className="grid gap-1">
                <span className="text-xs text-muted-foreground">
                  Koszt roczny
                </span>
                <span className="text-xl font-semibold tabular-nums">
                  {yearlyPrimary}
                </span>
                {yearlyOrig ? (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {yearlyOrig}
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
