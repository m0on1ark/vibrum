"use server";

import { API_PATHS, apiUrl } from "@/constants/api-paths";
import { readApiError } from "@/lib/shared/api-error";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/auth/schema";

export async function resetPasswordAction(
  token: string,
  input: ResetPasswordInput,
) {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success || !token) {
    return { error: "Invalid inputs" };
  }

  const response = await fetch(apiUrl(API_PATHS.auth.resetPassword), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword: parsed.data.newPassword }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { error: await readApiError(response) };
  }

  return { error: null };
}
