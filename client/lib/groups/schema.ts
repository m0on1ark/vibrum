import { z } from "zod";

import { CURRENCY_CODES } from "@/constants/currencies";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a group name")
    .max(100, "Name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters"),
});

export const inviteMemberSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export const createExpenseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a title")
    .max(200, "Title must be at most 200 characters"),
  amount: z
    .number("Enter an amount")
    .positive("Amount must be greater than zero"),
  currency: z.enum(CURRENCY_CODES),
  expenseDate: z.string().min(1, "Pick a date"),
  splitMode: z.enum(["EQUAL", "PERCENT", "FIXED"]),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export type SplitEntryInput = {
  userId: number;
  percent?: number;
  amount?: number;
};
