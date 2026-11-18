"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_PATHS } from "@/constants";
import { BANK_TYPE_LABELS, type BankAccount } from "@/lib/accounts/types";
import type { Category } from "@/lib/categories/types";
import {
  buildTransactionsHref,
  hasActiveTransactionFilters,
  TRANSACTION_PAGE_SIZES,
  TRANSACTION_SORT_OPTIONS,
  type TransactionFilters,
  type TransactionSort,
} from "@/lib/transactions/types";

const ALL_VALUE = "all";

export function TransactionsFilters({
  filters,
  accounts,
  categories,
}: {
  filters: TransactionFilters;
  accounts: BankAccount[];
  categories: Category[];
}) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(
    filters.accountId != null ? String(filters.accountId) : ALL_VALUE,
  );
  const [categoryId, setCategoryId] = useState(
    filters.categoryId != null ? String(filters.categoryId) : ALL_VALUE,
  );
  const [startDate, setStartDate] = useState(filters.startDate);
  const [endDate, setEndDate] = useState(filters.endDate);
  const [sort, setSort] = useState<TransactionSort>(filters.sort);
  const [size, setSize] = useState(String(filters.size));

  const isFiltered = hasActiveTransactionFilters(filters);
  const isInvertedRange = Boolean(startDate && endDate && startDate > endDate);
  const hasUnknownAccount =
    accountId !== ALL_VALUE &&
    !accounts.some((account) => String(account.id) === accountId);
  const hasUnknownCategory =
    categoryId !== ALL_VALUE &&
    !categories.some((category) => String(category.id) === categoryId);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isInvertedRange) return;

    router.push(
      buildTransactionsHref({
        accountId: accountId === ALL_VALUE ? null : Number(accountId),
        categoryId: categoryId === ALL_VALUE ? null : Number(categoryId),
        startDate,
        endDate,
        sort,
        size: Number(size),
        page: 0,
      }),
    );
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="filter-account">Konto</FieldLabel>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="filter-account" className="w-full">
                  <SelectValue>
                    {hasUnknownAccount ? `Konto #${accountId}` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Wszystkie konta</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.accountName} ({BANK_TYPE_LABELS[account.bankType]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="filter-category">Kategoria</FieldLabel>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="filter-category" className="w-full">
                  <SelectValue>
                    {hasUnknownCategory
                      ? `Kategoria #${categoryId}`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Wszystkie kategorie</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="filter-sort">Sortowanie</FieldLabel>
              <Select
                value={sort}
                onValueChange={(value) => setSort(value as TransactionSort)}
              >
                <SelectTrigger id="filter-sort" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="filter-start-date">Data od</FieldLabel>
              <Input
                id="filter-start-date"
                type="date"
                value={startDate}
                max={endDate || undefined}
                aria-invalid={isInvertedRange || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="filter-end-date">Data do</FieldLabel>
              <Input
                id="filter-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                aria-invalid={isInvertedRange || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </Field>

            <div className="flex items-end gap-2">
              <Field className="w-28 shrink-0">
                <FieldLabel htmlFor="filter-size">Na stronie</FieldLabel>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger id="filter-size" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_PAGE_SIZES.map((pageSize) => (
                      <SelectItem key={pageSize} value={String(pageSize)}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Button type="submit">Filtruj</Button>

              {isFiltered ? (
                <Button asChild type="button" variant="outline">
                  <Link href={APP_PATHS.transactions}>Wyczyść</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <FormError
            message={
              isInvertedRange
                ? "Data od nie może być późniejsza niż data do."
                : null
            }
          />
        </form>
      </CardContent>
    </Card>
  );
}
