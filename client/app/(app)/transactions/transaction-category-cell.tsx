"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { InlineError } from "@/components/inline-error";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NETWORK_ERROR_MESSAGE } from "@/constants";
import type { CategoryOption } from "@/lib/transactions/types";
import { cn } from "@/lib/utils";

import { updateTransactionCategoryAction } from "./actions";

const NONE_VALUE = "none";

export function TransactionCategoryCell({
  transactionId,
  categoryId,
  categoryName,
  categoryManual,
  categories,
}: {
  transactionId: number;
  categoryId: number | null;
  categoryName: string | null;
  categoryManual: boolean;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentValue = categoryId != null ? String(categoryId) : NONE_VALUE;
  const hasCurrentInOptions =
    categoryId == null || categories.some((item) => item.id === categoryId);

  function handleChange(value: string) {
    const nextCategoryId = value === NONE_VALUE ? null : Number(value);
    if (nextCategoryId === categoryId) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await updateTransactionCategoryAction(
          transactionId,
          nextCategoryId,
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        router.refresh();
      } catch {
        setError(NETWORK_ERROR_MESSAGE);
      }
    });
  }

  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-2">
        <Select
          value={currentValue}
          onValueChange={handleChange}
          disabled={pending}
        >
          <SelectTrigger
            size="sm"
            aria-label="Kategoria transakcji"
            className={cn(
              "w-44",
              categoryId == null && "text-muted-foreground",
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>Bez kategorii</SelectItem>
            {!hasCurrentInOptions && categoryId != null ? (
              <SelectItem value={String(categoryId)}>
                {categoryName ?? `Kategoria #${categoryId}`}
              </SelectItem>
            ) : null}
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categoryManual ? (
          <Badge
            variant="outline"
            title="Kategoria ustawiona ręcznie — nie zostanie nadpisana podczas ponownej kategoryzacji"
          >
            Ręczna
          </Badge>
        ) : null}
      </div>
      <InlineError message={error} />
    </div>
  );
}
