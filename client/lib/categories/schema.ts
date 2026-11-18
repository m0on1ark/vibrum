import { z } from "zod";

import { CATEGORY_TYPES, RULE_MATCH_TYPES, RULE_TARGETS } from "./types";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a category name")
    .max(100, "Category name must be at most 100 characters"),
  type: z.enum(CATEGORY_TYPES),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const ruleSchema = z.object({
  categoryId: z
    .number("Select a category")
    .int("Select a category")
    .positive("Select a category"),
  matchType: z.enum(RULE_MATCH_TYPES),
  target: z.enum(RULE_TARGETS),
  pattern: z
    .string()
    .trim()
    .min(1, "Enter a pattern")
    .max(255, "Pattern must be at most 255 characters"),
  priority: z
    .number("Enter a valid priority")
    .int("Priority must be a whole number"),
});

export type RuleInput = z.infer<typeof ruleSchema>;

export const testRuleSchema = z
  .object({
    title: z
      .string()
      .trim()
      .max(500, "Title must be at most 500 characters"),
    counterparty: z
      .string()
      .trim()
      .max(500, "Counterparty must be at most 500 characters"),
  })
  .refine(
    (data) => data.title.length > 0 || data.counterparty.length > 0,
    {
      message: "Enter a title or counterparty",
      path: ["title"],
    },
  );

export type TestRuleInput = z.infer<typeof testRuleSchema>;
