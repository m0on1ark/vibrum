"use server";

import { API_PATHS } from "@/constants/api-paths";
import { requestAuthToken } from "@/lib/auth/request";
import { signUpSchema, type SignUpInput } from "@/lib/auth/schema";

export async function signUpAction(input: SignUpInput) {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid inputs" };
  }

  return requestAuthToken(API_PATHS.auth.register, parsed.data);
}
