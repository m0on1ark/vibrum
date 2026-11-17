import { headers } from "next/headers";

import { apiUrl } from "@/constants/api-paths";

import { readApiError } from "@/lib/shared/api-error";
import type { AuthTokenResponse } from "@/lib/auth/schema";
import { readRefreshCookie } from "@/lib/auth/session";
import { setSessionCookies } from "@/lib/auth/server";

export async function requestAuthToken(path: string, body: unknown) {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") ?? "Unknown";

  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": userAgent,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    return { error: await readApiError(response) };
  }

  const data = (await response.json()) as AuthTokenResponse;
  await setSessionCookies({
    accessToken: data.accessToken,
    expiresIn: data.expiresIn,
    refresh: readRefreshCookie(response),
  });
  return { error: null };
}
