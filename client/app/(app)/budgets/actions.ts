"use server";

import { APP_PATHS, INVALID_INPUTS_MESSAGE } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import {
  createBudgetSchema,
  updateBudgetSchema,
  type CreateBudgetInput,
  type UpdateBudgetInput,
} from "@/lib/budgets/schema";
import type { Budget } from "@/lib/budgets/types";
import { callApi } from "@/lib/shared/call-api";

const BUDGET_REVALIDATE_PATHS = [APP_PATHS.budgets];

function isValidId(id: number) {
  return Number.isInteger(id) && id > 0;
}

export async function createBudgetAction(input: CreateBudgetInput) {
  const parsed = createBudgetSchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUTS_MESSAGE, budget: null };

  const result = await callApi(API_PATHS.budgets.root, {
    body: parsed.data,
    revalidate: BUDGET_REVALIDATE_PATHS,
  });
  if (!result.ok) return { error: result.error, budget: null };

  const budget = (await result.response.json()) as Budget;
  return { error: null, budget };
}

export async function updateBudgetAction(
  budgetId: number,
  input: UpdateBudgetInput,
) {
  if (!isValidId(budgetId)) {
    return { error: INVALID_INPUTS_MESSAGE, budget: null };
  }

  const parsed = updateBudgetSchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUTS_MESSAGE, budget: null };

  const result = await callApi(API_PATHS.budgets.detail(budgetId), {
    method: "PUT",
    body: parsed.data,
    revalidate: BUDGET_REVALIDATE_PATHS,
  });
  if (!result.ok) return { error: result.error, budget: null };

  const budget = (await result.response.json()) as Budget;
  return { error: null, budget };
}

export async function deleteBudgetAction(budgetId: number) {
  if (!isValidId(budgetId)) {
    return { error: INVALID_INPUTS_MESSAGE };
  }

  const { error } = await callApi(API_PATHS.budgets.detail(budgetId), {
    method: "DELETE",
    revalidate: BUDGET_REVALIDATE_PATHS,
  });
  return { error };
}
