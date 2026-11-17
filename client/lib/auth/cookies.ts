import { isProduction } from "@/configs";

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

export const DEFAULT_REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

// The access cookie expires slightly before the JWT so the proxy refreshes
// the session instead of sending a token that is about to be rejected.
const ACCESS_TOKEN_LEEWAY_SECONDS = 30;

export function accessTokenMaxAge(expiresIn: number) {
  return Math.max(expiresIn - ACCESS_TOKEN_LEEWAY_SECONDS, 1);
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    path: "/",
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge,
  };
}
