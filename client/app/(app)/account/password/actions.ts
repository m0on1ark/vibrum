"use server";

import { API_PATHS, apiUrl } from "@/constants/api-paths";
import { readApiError } from "@/lib/shared/api-error";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/auth/schema";
import { fetchWithAuth, isTokenRejection } from "@/lib/shared/fetch-with-auth";
import { clearAuthCookies } from "@/lib/auth/server";

export async function changePasswordAction(input: ChangePasswordInput) {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid inputs" };
  }

  const response = await fetchWithAuth(apiUrl(API_PATHS.users.changePassword), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    }),
  });

  if (response.status === 401) {
    return {
      error: isTokenRejection(response)
        ? "Session expired. Sign in again."
        : "Current password is incorrect.",
    };
  }
  if (!response.ok) {
    return { error: await readApiError(response) };
  }

  // The backend revokes every refresh session on a password change,
  // so this device has to sign in again with the new password.
  await clearAuthCookies();
  return { error: null };
}
