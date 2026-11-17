"use server";

import { APP_PATHS, INVALID_INPUTS_MESSAGE } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import {
  categorySchema,
  ruleSchema,
  testRuleSchema,
  type CategoryInput,
  type RuleInput,
  type TestRuleInput,
} from "@/lib/categories/schema";
import type {
  CategorizationRule,
  CategorizationTestResult,
  Category,
} from "@/lib/categories/types";
import { callApi } from "@/lib/shared/call-api";

const CATEGORY_REVALIDATE_PATHS = [
  APP_PATHS.categories,
  APP_PATHS.transactions,
];
const RULE_REVALIDATE_PATHS = [APP_PATHS.categories];

function isValidId(id: number) {
  return Number.isInteger(id) && id > 0;
}

export async function createCategoryAction(input: CategoryInput) {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUTS_MESSAGE, category: null };

  const result = await callApi(API_PATHS.categories.root, {
    body: parsed.data,
    revalidate: CATEGORY_REVALIDATE_PATHS,
  });
  if (!result.ok) return { error: result.error, category: null };

  const category = (await result.response.json()) as Category;
  return { error: null, category };
}

export async function updateCategoryAction(
  categoryId: number,
  input: CategoryInput,
) {
  if (!isValidId(categoryId)) {
    return { error: INVALID_INPUTS_MESSAGE, category: null };
  }

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUTS_MESSAGE, category: null };

  const result = await callApi(API_PATHS.categories.detail(categoryId), {
    method: "PUT",
    body: parsed.data,
    revalidate: CATEGORY_REVALIDATE_PATHS,
  });
  if (!result.ok) return { error: result.error, category: null };

  const category = (await result.response.json()) as Category;
  return { error: null, category };
}

export async function deleteCategoryAction(categoryId: number) {
  if (!isValidId(categoryId)) {
    return { error: INVALID_INPUTS_MESSAGE };
  }

  const { error } = await callApi(API_PATHS.categories.detail(categoryId), {
    method: "DELETE",
    revalidate: CATEGORY_REVALIDATE_PATHS,
  });
  return { error };
}

export async function createRuleAction(input: RuleInput) {
  const parsed = ruleSchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUTS_MESSAGE, rule: null };

  const result = await callApi(API_PATHS.categorizationRules.root, {
    body: parsed.data,
    revalidate: RULE_REVALIDATE_PATHS,
  });
  if (!result.ok) return { error: result.error, rule: null };

  const rule = (await result.response.json()) as CategorizationRule;
  return { error: null, rule };
}

export async function updateRuleAction(ruleId: number, input: RuleInput) {
  if (!isValidId(ruleId)) {
    return { error: INVALID_INPUTS_MESSAGE, rule: null };
  }

  const parsed = ruleSchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUTS_MESSAGE, rule: null };

  const result = await callApi(API_PATHS.categorizationRules.detail(ruleId), {
    method: "PUT",
    body: parsed.data,
    revalidate: RULE_REVALIDATE_PATHS,
  });
  if (!result.ok) return { error: result.error, rule: null };

  const rule = (await result.response.json()) as CategorizationRule;
  return { error: null, rule };
}

export async function deleteRuleAction(ruleId: number) {
  if (!isValidId(ruleId)) {
    return { error: INVALID_INPUTS_MESSAGE };
  }

  const { error } = await callApi(API_PATHS.categorizationRules.detail(ruleId), {
    method: "DELETE",
    revalidate: RULE_REVALIDATE_PATHS,
  });
  return { error };
}

export async function testRuleAction(
  input: TestRuleInput,
): Promise<
  | { error: string; result: null }
  | { error: null; result: CategorizationTestResult }
> {
  const parsed = testRuleSchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUTS_MESSAGE, result: null };

  const apiResult = await callApi(API_PATHS.categorizationRules.test, {
    body: {
      title: parsed.data.title || null,
      counterparty: parsed.data.counterparty || null,
    },
  });
  if (!apiResult.ok) return { error: apiResult.error, result: null };

  const result = (await apiResult.response.json()) as CategorizationTestResult;
  return { error: null, result };
}
