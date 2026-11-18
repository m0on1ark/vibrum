import { Suspense } from "react";

import { LoadError } from "@/components/load-error";
import { Skeleton } from "@/components/ui/skeleton";
import { API_PATHS } from "@/constants/api-paths";
import { getUserBaseCurrencyContext } from "@/lib/currencies/get-base-currency";
import { getJson } from "@/lib/shared/get-json";
import type {
  Subscription,
  SubscriptionTotal,
} from "@/lib/subscriptions/types";

import { DetectSubscriptionsButton } from "./detect-subscriptions-button";
import { SubscriptionList } from "./subscription-list";

export default function SubscriptionsPage() {
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Subskrypcje
          </h1>
          <p className="text-muted-foreground">
            Monitoruj cykliczne opłaty wykryte na podstawie zaimportowanych
            transakcji oraz szacowane koszty miesięczne i roczne.
          </p>
        </div>
        <DetectSubscriptionsButton />
      </header>

      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <SubscriptionsContent />
      </Suspense>
    </div>
  );
}

async function SubscriptionsContent() {
  const [subscriptions, totals, baseCurrencyCtx] = await Promise.all([
    getJson<Subscription[]>(API_PATHS.subscriptions.root),
    getJson<SubscriptionTotal[]>(API_PATHS.subscriptions.summary),
    getUserBaseCurrencyContext(),
  ]);

  if (!subscriptions || !totals) {
    return <LoadError subject="subscriptions" />;
  }

  return (
    <SubscriptionList
      subscriptions={subscriptions}
      totals={totals}
      baseCurrencyCtx={baseCurrencyCtx}
    />
  );
}
