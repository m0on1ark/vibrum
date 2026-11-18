"use server";

import { APP_PATHS, INVALID_INPUTS_MESSAGE } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/auth/schema";
import { callApi } from "@/lib/shared/call-api";

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<{ error: string | null }> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: INVALID_INPUTS_MESSAGE };
  }

  const res = await callApi(API_PATHS.users.me, {
    method: "PATCH",
    body: parsed.data,
    revalidate: [APP_PATHS.profile, APP_PATHS.home],
  });

  return { error: res.ok ? null : res.error };
}
