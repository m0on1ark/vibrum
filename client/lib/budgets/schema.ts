import { z } from "zod";

import { BUDGET_CURRENCY } from "./types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const createBudgetSchema = z.object({
  categoryId: z
    .number("Select an expense category")
    .int("Select an expense category")
    .positive("Select an expense category"),
  monthYear: z
    .string()
    .regex(ISO_DATE_RE, "Select a valid month"),
  limitAmount: z
    .number("Enter a limit amount")
    .positive("Limit must be greater than zero"),
  currency: z.literal(BUDGET_CURRENCY),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = z.object({
  limitAmount: z
    .number("Enter a limit amount")
    .positive("Limit must be greater than zero"),
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
