"use server";

import { revalidatePath } from "next/cache";

import {
  APP_PATHS,
  INVALID_INPUTS_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants";
import { API_PATHS, apiUrl } from "@/constants/api-paths";
import {
  createAccountSchema,
  renameAccountSchema,
  validateStatementFile,
  type CreateAccountInput,
  type RenameAccountInput,
} from "@/lib/accounts/schema";
import type { BankAccount, ImportResult } from "@/lib/accounts/types";
import { readApiError } from "@/lib/shared/api-error";
import { callApi } from "@/lib/shared/call-api";
import { fetchWithAuth } from "@/lib/shared/fetch-with-auth";

export async function createAccountAction(input: CreateAccountInput) {
  const parsed = createAccountSchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUTS_MESSAGE, account: null };

  const result = await callApi(API_PATHS.accounts.root, {
    body: parsed.data,
    revalidate: [APP_PATHS.accounts, APP_PATHS.transactions],
  });
  if (!result.ok) return { error: result.error, account: null };

  const account = (await result.response.json()) as BankAccount;
  return { error: null, account };
}

export async function renameAccountAction(
  accountId: number,
  input: RenameAccountInput,
) {
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return { error: INVALID_INPUTS_MESSAGE, account: null };
  }

  const parsed = renameAccountSchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUTS_MESSAGE, account: null };

  const result = await callApi(API_PATHS.accounts.detail(accountId), {
    method: "PUT",
    body: parsed.data,
    revalidate: [APP_PATHS.accounts, APP_PATHS.transactions],
  });
  if (!result.ok) return { error: result.error, account: null };

  const account = (await result.response.json()) as BankAccount;
  return { error: null, account };
}

export async function deleteAccountAction(accountId: number) {
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return { error: INVALID_INPUTS_MESSAGE };
  }

  const { error } = await callApi(API_PATHS.accounts.detail(accountId), {
    method: "DELETE",
    revalidate: [APP_PATHS.accounts, APP_PATHS.transactions, APP_PATHS.budgets],
  });
  return { error };
}

export async function importStatementAction(
  accountId: number,
  formData: FormData,
): Promise<
  { error: string; result: null } | { error: null; result: ImportResult }
> {
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return { error: INVALID_INPUTS_MESSAGE, result: null };
  }

  const file = formData.get("file");
  const fileError = validateStatementFile(file);
  if (fileError || !(file instanceof File)) {
    return { error: fileError ?? "Select a non-empty file to import", result: null };
  }

  const body = new FormData();
  body.append("file", file);

  let response: Response;
  try {
    response = await fetchWithAuth(apiUrl(API_PATHS.accounts.import(accountId)), {
      method: "POST",
      body,
    });
  } catch {
    return { error: NETWORK_ERROR_MESSAGE, result: null };
  }

  if (!response.ok) {
    return { error: await readApiError(response), result: null };
  }

  const result = (await response.json()) as ImportResult;
  revalidatePath(APP_PATHS.accounts);
  revalidatePath(APP_PATHS.transactions);
  revalidatePath(APP_PATHS.budgets);
  return { error: null, result };
}
