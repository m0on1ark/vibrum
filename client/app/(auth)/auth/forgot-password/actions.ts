"use server";

import { API_PATHS, apiUrl } from "@/constants/api-paths";
import { readApiError } from "@/lib/shared/api-error";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/auth/schema";

export async function forgotPasswordAction(input: ForgotPasswordInput) {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid inputs" };
  }

  const response = await fetch(apiUrl(API_PATHS.auth.forgotPassword), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    cache: "no-store",
  });

  if (!response.ok) {
    return { error: await readApiError(response) };
  }

  return { error: null };
}
