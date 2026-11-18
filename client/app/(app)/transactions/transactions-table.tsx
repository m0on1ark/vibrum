import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { APP_PATHS } from "@/constants";
import { BANK_TYPE_LABELS, type BankAccount } from "@/lib/accounts/types";
import type { Category } from "@/lib/categories/types";
import { formatDate, formatMoney } from "@/lib/shared/format";
import { pluralPl } from "@/lib/shared/plural";
import {
  buildTransactionsHref,
  type NormalizedPage,
  type Transaction,
  type TransactionFilters,
} from "@/lib/transactions/types";
import { cn } from "@/lib/utils";

import { TransactionCategoryCell } from "./transaction-category-cell";

export function TransactionsTable({
  pageData,
  filters,
  accounts,
  categories,
  isFiltered,
}: {
  pageData: NormalizedPage<Transaction>;
  filters: TransactionFilters;
  accounts: BankAccount[];
  categories: Category[];
  isFiltered: boolean;
}) {
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  return (
    <>
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
        <TransactionsEmptyState
          pageData={pageData}
          filters={filters}
          isFiltered={isFiltered}
        />
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
            {pageData.content.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                account={accountById.get(tx.accountId)}
                filters={filters}
                categories={categories}
              />
            ))}
          </TableBody>
        </Table>
      )}

      {pageData.totalPages > 1 ? (
        <TransactionsPagination pageData={pageData} filters={filters} />
      ) : null}
    </>
  );
}

function TransactionsEmptyState({
  pageData,
  filters,
  isFiltered,
}: {
  pageData: NormalizedPage<Transaction>;
  filters: TransactionFilters;
  isFiltered: boolean;
}) {
  if (pageData.totalElements > 0) {
    return (
      <div className="grid gap-2 text-muted-foreground">
        <p>
          Brak transakcji na tej stronie.
          {pageData.number > 0 ? (
            <>
              {" "}
              <Link
                href={buildTransactionsHref({ ...filters, page: 0 })}
                className="font-medium text-primary underline underline-offset-4 hover:no-underline"
              >
                Wróć do pierwszej strony
              </Link>
              .
            </>
          ) : null}
        </p>
      </div>
    );
  }

  return (
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
  );
}

function TransactionRow({
  tx,
  account,
  filters,
  categories,
}: {
  tx: Transaction;
  account: BankAccount | undefined;
  filters: TransactionFilters;
  categories: Category[];
}) {
  const showRecipient =
    tx.recipient && tx.recipient.trim() !== tx.title.trim();

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatDate(tx.date)}
      </TableCell>
      <TableCell className="max-w-xs whitespace-normal">
        <div className="font-medium">{tx.title}</div>
        {showRecipient ? (
          <div className="text-xs text-muted-foreground">{tx.recipient}</div>
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
          categories={categories}
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
}

function TransactionsPagination({
  pageData,
  filters,
}: {
  pageData: NormalizedPage<Transaction>;
  filters: TransactionFilters;
}) {
  const prevPage = Math.max(
    0,
    Math.min(pageData.number - 1, pageData.totalPages - 1),
  );

  return (
    <div className="flex items-center justify-between gap-4">
      {pageData.first ? (
        <Button variant="outline" size="sm" disabled>
          Poprzednia
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link href={buildTransactionsHref({ ...filters, page: prevPage })}>
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
  );
}
