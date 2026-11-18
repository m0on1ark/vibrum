"use client";

import Link from "next/link";

import { InlineError } from "@/components/inline-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { APP_PATHS } from "@/constants";
import { useServerAction } from "@/hooks/use-server-action";
import {
  type BaseCurrencyContext,
  DEFAULT_BASE_CURRENCY_CTX,
  formatOriginalPln,
  formatPrimaryFromPln,
} from "@/lib/currencies/base-currency";
import { formatDate, formatMoney } from "@/lib/shared/format";
import { pluralPl } from "@/lib/shared/plural";
import {
  BILLING_PERIOD_LABELS,
  type Subscription,
  type SubscriptionTotal,
} from "@/lib/subscriptions/types";

import { dismissSubscriptionAction } from "./actions";
import { DetectSubscriptionsButton } from "./detect-subscriptions-button";
import { SubscriptionSummaryCards } from "./subscription-summary-cards";

export function SubscriptionList({
  subscriptions,
  totals,
  baseCurrencyCtx = DEFAULT_BASE_CURRENCY_CTX,
}: {
  subscriptions: Subscription[];
  totals: SubscriptionTotal[];
  baseCurrencyCtx?: BaseCurrencyContext;
}) {
  const { run, pending, error } = useServerAction();

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brak wykrytych subskrypcji</CardTitle>
          <CardDescription>
            Subskrypcje są wykrywane na podstawie powtarzających się płatności z
            zaimportowanych wyciągów bankowych. Zaimportuj transakcje na stronie
            kont, a następnie kliknij „Wykryj subskrypcje”.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <DetectSubscriptionsButton />
          <Button asChild variant="outline">
            <Link href={APP_PATHS.accounts}>Przejdź do kont i importu</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <SubscriptionSummaryCards
        totals={totals}
        baseCurrencyCtx={baseCurrencyCtx}
      />

      <InlineError message={error} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usługa / Odbiorca</TableHead>
            <TableHead>Kategoria</TableHead>
            <TableHead>Cykl</TableHead>
            <TableHead>Ostatnia płatność</TableHead>
            <TableHead>Następna płatność</TableHead>
            <TableHead className="text-right">Kwota</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((sub) => {
            const isConvertedPln =
              sub.currency === "PLN" && baseCurrencyCtx.baseCurrency !== "PLN";
            const primaryAmount = isConvertedPln
              ? formatPrimaryFromPln(sub.amount, baseCurrencyCtx)
              : formatMoney(sub.amount, sub.currency);
            const origAmount = isConvertedPln
              ? formatOriginalPln(sub.amount, baseCurrencyCtx)
              : null;

            return (
              <TableRow key={sub.id}>
                <TableCell className="max-w-xs whitespace-normal">
                  <div className="font-medium">{sub.merchant}</div>
                  <div className="text-xs text-muted-foreground">
                    {sub.occurrences}{" "}
                    {pluralPl(
                      sub.occurrences,
                      "płatność",
                      "płatności",
                      "płatności",
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {sub.categoryName ? (
                    <Badge variant="secondary">{sub.categoryName}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Bez kategorii
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {BILLING_PERIOD_LABELS[sub.billingPeriod]}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(sub.lastPaymentDate)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(sub.nextPaymentDate)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  <div>{primaryAmount}</div>
                  {origAmount ? (
                    <div className="text-xs font-normal text-muted-foreground">
                      {origAmount}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => dismissSubscriptionAction(sub.id))}
                  >
                    To nie subskrypcja
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
