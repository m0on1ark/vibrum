import { NextResponse, type NextRequest } from "next/server";

import {
  APP_PATHS,
  AUTH_PATH_PREFIX,
  GUEST_ONLY_PATHS,
} from "@/constants/app-paths";
import {
  ACCESS_TOKEN_COOKIE,
  accessTokenMaxAge,
  DEFAULT_REFRESH_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth-cookies";
import { refreshSession, type Session } from "@/lib/refresh-session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith(AUTH_PATH_PREFIX);

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  let refreshed: Session | null = null;
  let sessionRevoked = false;

  // The access cookie expires together with the JWT. Without it but with a refresh
  // cookie the session is still alive, so renew it before rendering anything.
  if (!accessToken && refreshToken) {
    const result = await refreshSession(refreshToken);

    if (result.status === "ok") {
      refreshed = result.session;
      accessToken = refreshed.accessToken;
      request.cookies.set(ACCESS_TOKEN_COOKIE, accessToken);
      if (refreshed.refresh) {
        request.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refresh.value);
      }
    } else if (result.status === "invalid") {
      sessionRevoked = true;
      request.cookies.delete(REFRESH_TOKEN_COOKIE);
    }
  }

  const isAuthenticated = Boolean(accessToken);
  let response: NextResponse;

  if (!isAuthenticated && !isAuthRoute) {
    response = NextResponse.redirect(new URL(APP_PATHS.signIn, request.url));
  } else if (
    isAuthenticated &&
    request.method === "GET" &&
    GUEST_ONLY_PATHS.includes(pathname)
  ) {
    response = NextResponse.redirect(new URL(APP_PATHS.home, request.url));
  } else {
    response = NextResponse.next({ request });
  }

  if (refreshed) {
    response.cookies.set(
      ACCESS_TOKEN_COOKIE,
      refreshed.accessToken,
      sessionCookieOptions(accessTokenMaxAge(refreshed.expiresIn)),
    );
    if (refreshed.refresh) {
      response.cookies.set(
        REFRESH_TOKEN_COOKIE,
        refreshed.refresh.value,
        sessionCookieOptions(refreshed.refresh.maxAge ?? DEFAULT_REFRESH_MAX_AGE),
      );
    }
  }
  if (sessionRevoked) response.cookies.delete(REFRESH_TOKEN_COOKIE);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
