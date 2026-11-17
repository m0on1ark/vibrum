import { z } from "zod";

import { CURRENCY_CODES } from "@/constants/currencies";

import { BANK_TYPES } from "./types";

const accountNameSchema = z
  .string()
  .trim()
  .min(1, "Enter an account name")
  .max(100, "Account name must be at most 100 characters");

export const createAccountSchema = z.object({
  accountName: accountNameSchema,
  bankType: z.enum(BANK_TYPES),
  baseCurrency: z.enum(CURRENCY_CODES),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const renameAccountSchema = z.object({
  accountName: accountNameSchema,
});

export type RenameAccountInput = z.infer<typeof renameAccountSchema>;

export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;

export function validateStatementFile(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) {
    return "Select a non-empty file to import";
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return "File size must be at most 10 MB";
  }
  return null;
}
