import Link from "next/link";
import { Suspense } from "react";

import { LoadError } from "@/components/load-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { APP_PATHS } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import { BANK_TYPE_LABELS, type BankAccount } from "@/lib/accounts/types";
import { formatDate, formatMoney } from "@/lib/shared/format";
import { getJson } from "@/lib/shared/get-json";
import { pluralPl } from "@/lib/shared/plural";
import {
  buildTransactionQuery,
  buildTransactionsHref,
  hasActiveTransactionFilters,
  normalizePage,
  parseTransactionSearchParams,
  type CategoryOption,
  type RawSpringPage,
  type Transaction,
} from "@/lib/transactions/types";
import { cn } from "@/lib/utils";

import { RecategorizeControl } from "./recategorize-control";
import { TransactionCategoryCell } from "./transaction-category-cell";
import { TransactionsFilters } from "./transactions-filters";

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
    getJson<CategoryOption[]>(API_PATHS.categories.root),
  ]);

  if (!rawPage) return <LoadError subject="transactions" />;

  const pageData = normalizePage(rawPage);
  const accountList = accounts ?? [];
  const categoryList = categories ?? [];
  const accountById = new Map(
    accountList.map((account) => [account.id, account]),
  );
  const isFiltered = hasActiveTransactionFilters(filters);

  return (
    <div className="grid gap-6">
      <TransactionsFilters
        key={query}
        filters={filters}
        accounts={accountList}
        categories={categoryList}
      />

      {pageData.totalElements > 0 || isFiltered ? <RecategorizeControl /> : null}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          Łącznie: {pageData.totalElements}{" "}
          {pluralPl(
            pageData.totalElements,
            "transakcja",
            "transakcje",
            "transakcji",
          )}
        </p>
        {pageData.totalPages > 1 ? (
          <p>
            Strona {pageData.number + 1} z {pageData.totalPages}
          </p>
        ) : null}
      </div>

      {pageData.content.length === 0 ? (
        <div className="grid gap-2 text-muted-foreground">
          {isFiltered ? (
            <p>Brak transakcji spełniających wybrane kryteria.</p>
          ) : (
            <p>
              Brak zaimportowanych transakcji.{" "}
              <Link
                href={APP_PATHS.accounts}
                className="font-medium text-primary underline underline-offset-4 hover:no-underline"
              >
                Przejdź do kont bankowych
              </Link>
              , aby zaimportować pierwszy wyciąg.
            </p>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tytuł / Odbiorca</TableHead>
              <TableHead>Konto</TableHead>
              <TableHead>Kategoria</TableHead>
              <TableHead className="text-right">Kwota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.content.map((tx) => {
              const account = accountById.get(tx.accountId);
              const showRecipient =
                tx.recipient && tx.recipient.trim() !== tx.title.trim();

              return (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-normal">
                    <div className="font-medium">{tx.title}</div>
                    {showRecipient ? (
                      <div className="text-xs text-muted-foreground">
                        {tx.recipient}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link
                      href={buildTransactionsHref({
                        ...filters,
                        accountId: tx.accountId,
                        page: 0,
                      })}
                      className="hover:underline"
                    >
                      {account ? (
                        <>
                          {account.accountName}{" "}
                          <span className="text-muted-foreground">
                            ({BANK_TYPE_LABELS[account.bankType]})
                          </span>
                        </>
                      ) : (
                        tx.accountName
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <TransactionCategoryCell
                      transactionId={tx.id}
                      categoryId={tx.categoryId}
                      categoryName={tx.categoryName}
                      categoryManual={tx.categoryManual}
                      categories={categoryList}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <div
                      className={cn(
                        "font-medium",
                        tx.amount > 0 && "text-emerald-600",
                      )}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {formatMoney(tx.amount, tx.currency)}
                    </div>
                    {tx.currency !== "PLN" ? (
                      <div className="text-xs text-muted-foreground">
                        {tx.amountInPln > 0 ? "+" : ""}
                        {formatMoney(tx.amountInPln, "PLN")}
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {pageData.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-4">
          {pageData.first ? (
            <Button variant="outline" size="sm" disabled>
              Poprzednia
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link
                href={buildTransactionsHref({
                  ...filters,
                  page: pageData.number - 1,
                })}
              >
                Poprzednia
              </Link>
            </Button>
          )}

          <span className="text-sm text-muted-foreground">
            Strona {pageData.number + 1} z {pageData.totalPages}
          </span>

          {pageData.last ? (
            <Button variant="outline" size="sm" disabled>
              Następna
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link
                href={buildTransactionsHref({
                  ...filters,
                  page: pageData.number + 1,
                })}
              >
                Następna
              </Link>
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
