import { env } from "@/configs";
import { headers } from "next/headers";

import { readApiError } from "./api-error";
import type { AuthTokenResponse } from "./auth-schema";
import { setAccessToken } from "./server-auth";

export async function requestAuthToken(path: string, body: unknown) {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") ?? "Unknown";

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
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
  await setAccessToken(data.accessToken, data.expiresIn);
  return { error: null };
}
