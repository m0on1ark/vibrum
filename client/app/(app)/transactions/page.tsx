import Link from "next/link";
import { Suspense } from "react";

import { LoadError } from "@/components/load-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import type { BankAccount } from "@/lib/accounts/types";
import type { Category } from "@/lib/categories/types";
import { getJson } from "@/lib/shared/get-json";
import {
  buildTransactionQuery,
  hasActiveTransactionFilters,
  normalizePage,
  parseTransactionSearchParams,
  type RawSpringPage,
  type Transaction,
} from "@/lib/transactions/types";

import { RecategorizeControl } from "./recategorize-control";
import { TransactionsFilters } from "./transactions-filters";
import { TransactionsTable } from "./transactions-table";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Transakcje
          </h1>
          <p className="text-muted-foreground">
            Historia zaimportowanych operacji bankowych z filtrowaniem i
            sortowaniem.
          </p>
        </div>
        <Button asChild variant="outline" size="lg" className="h-11 text-base">
          <Link href={APP_PATHS.accounts}>Konta i import</Link>
        </Button>
      </header>

      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <TransactionsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function TransactionsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const rawParams = await searchParams;
  const filters = parseTransactionSearchParams(rawParams);
  const query = buildTransactionQuery(filters);
  const endpoint = query
    ? `${API_PATHS.transactions.root}?${query}`
    : API_PATHS.transactions.root;

  const [rawPage, accounts, categories] = await Promise.all([
    getJson<RawSpringPage<Transaction>>(endpoint),
    getJson<BankAccount[]>(API_PATHS.accounts.root),
    getJson<Category[]>(API_PATHS.categories.root),
  ]);

  if (!rawPage) return <LoadError subject="transactions" />;
  if (accounts === null) return <LoadError subject="accounts" />;
  if (categories === null) return <LoadError subject="categories" />;

  const pageData = normalizePage(rawPage);
  const isFiltered = hasActiveTransactionFilters(filters);
  const filterKey = buildTransactionQuery({ ...filters, page: 0 });

  return (
    <div className="grid gap-6">
      <TransactionsFilters
        key={filterKey}
        filters={filters}
        accounts={accounts}
        categories={categories}
      />

      {pageData.totalElements > 0 || isFiltered ? <RecategorizeControl /> : null}

      <TransactionsTable
        pageData={pageData}
        filters={filters}
        accounts={accounts}
        categories={categories}
        isFiltered={isFiltered}
      />
    </div>
  );
}
