import { API_PATHS, apiUrl } from "@/constants/api-paths";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookies";
import type { AuthTokenResponse } from "@/lib/auth/schema";

export type RefreshCookie = { value: string; maxAge: number | null };

export type Session = {
  accessToken: string;
  expiresIn: number;
  refresh: RefreshCookie | null;
};

export type RefreshResult =
  | { status: "ok"; session: Session }
  | { status: "invalid" }
  | { status: "unavailable" };

// Spring sets the refresh token through Set-Cookie. Server-to-server fetch
// never hands that cookie to the browser, so we read it and store it ourselves.
export function readRefreshCookie(response: Response): RefreshCookie | null {
  for (const header of response.headers.getSetCookie()) {
    const [pair, ...attributes] = header.split(";").map((part) => part.trim());
    const separator = pair.indexOf("=");
    if (separator === -1 || pair.slice(0, separator) !== REFRESH_TOKEN_COOKIE) {
      continue;
    }

    const value = pair.slice(separator + 1);
    if (!value) return null;

    const maxAgeAttribute = attributes.find((attribute) =>
      attribute.toLowerCase().startsWith("max-age="),
    );
    const maxAge = maxAgeAttribute
      ? Number(maxAgeAttribute.split("=")[1])
      : NaN;
    return { value, maxAge: Number.isFinite(maxAge) ? maxAge : null };
  }

  return null;
}

// Refresh tokens rotate: the old one dies after a single use. Parallel requests
// (prefetch, RSC payloads) that carry the same token would make the second one
// fail and log the user out, so concurrent calls share a single result.
const DEDUPE_WINDOW_MS = 10_000;
const recent = new Map<
  string,
  { result: Promise<RefreshResult>; at: number }
>();

export function refreshSession(refreshToken: string): Promise<RefreshResult> {
  const now = Date.now();
  for (const [token, entry] of recent) {
    if (now - entry.at > DEDUPE_WINDOW_MS) recent.delete(token);
  }

  const cached = recent.get(refreshToken);
  if (cached) return cached.result;

  const result = requestRefresh(refreshToken);
  recent.set(refreshToken, { result, at: now });
  void result.then((value) => {
    if (value.status === "unavailable") recent.delete(refreshToken);
  });
  return result;
}

async function requestRefresh(refreshToken: string): Promise<RefreshResult> {
  try {
    const response = await fetch(apiUrl(API_PATHS.auth.refresh), {
      method: "POST",
      headers: { Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}` },
      cache: "no-store",
    });

    if (response.status === 401) return { status: "invalid" };
    if (!response.ok) return { status: "unavailable" };

    const data = (await response.json()) as AuthTokenResponse;
    return {
      status: "ok",
      session: {
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
        refresh: readRefreshCookie(response),
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}
