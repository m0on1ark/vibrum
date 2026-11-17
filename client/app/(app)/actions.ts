"use server";

import { redirect } from "next/navigation";

import { APP_PATHS } from "@/constants";
import { API_PATHS, apiUrl } from "@/constants/api-paths";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth-cookies";
import { clearAuthCookies, getRefreshToken } from "@/lib/server-auth";

export async function signOutAction() {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    await fetch(apiUrl(API_PATHS.auth.logout), {
      method: "POST",
      headers: { Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}` },
      cache: "no-store",
    }).catch(() => undefined);
  }

  await clearAuthCookies();
  redirect(APP_PATHS.signIn);
}
