"use server";

import { API_PATHS } from "@/constants/api-paths";
import { requestAuthToken } from "@/lib/auth-request";
import { signInSchema, type SignInInput } from "@/lib/auth-schema";

export async function signInAction(input: SignInInput) {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid inputs" };
  }

  return requestAuthToken(API_PATHS.auth.login, parsed.data);
}
