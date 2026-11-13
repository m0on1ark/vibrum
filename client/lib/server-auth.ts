import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  accessTokenMaxAge,
  DEFAULT_REFRESH_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  sessionCookieOptions,
} from "./auth-cookies";
import type { Session } from "./refresh-session";

export async function setSessionCookies(session: Session) {
  const cookieStore = await cookies();

  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    session.accessToken,
    sessionCookieOptions(accessTokenMaxAge(session.expiresIn)),
  );

  if (session.refresh) {
    cookieStore.set(
      REFRESH_TOKEN_COOKIE,
      session.refresh.value,
      sessionCookieOptions(session.refresh.maxAge ?? DEFAULT_REFRESH_MAX_AGE),
    );
  }
}

export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}
