"use server";

import { APP_PATHS, INVALID_INPUTS_MESSAGE } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import { callApi } from "@/lib/shared/call-api";
import type { RecategorizeResult, Transaction } from "@/lib/transactions/types";

export async function updateTransactionCategoryAction(
  transactionId: number,
  categoryId: number | null,
) {
  if (
    !Number.isInteger(transactionId) ||
    transactionId <= 0 ||
    (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0))
  ) {
    return { error: INVALID_INPUTS_MESSAGE, transaction: null };
  }

  const result = await callApi(API_PATHS.transactions.category(transactionId), {
    method: "PATCH",
    body: { categoryId },
    revalidate: [APP_PATHS.transactions],
  });
  if (!result.ok) return { error: result.error, transaction: null };

  const transaction = (await result.response.json()) as Transaction;
  return { error: null, transaction };
}

export async function recategorizeTransactionsAction(): Promise<
  { error: string; result: null } | { error: null; result: RecategorizeResult }
> {
  const response = await callApi(API_PATHS.transactions.recategorize, {
    method: "POST",
    revalidate: [APP_PATHS.transactions],
  });
  if (!response.ok) return { error: response.error, result: null };

  const result = (await response.response.json()) as RecategorizeResult;
  return { error: null, result };
}
