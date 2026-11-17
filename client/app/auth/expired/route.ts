import { NextResponse } from "next/server";

import { APP_PATHS } from "@/constants/app-paths";
import { clearAuthCookies } from "@/lib/server-auth";

// Landing point when the backend rejects a token we still hold: drop the cookies
// so the proxy does not bounce the user between the app and the sign-in page.
export async function GET(request: Request) {
  await clearAuthCookies();
  return NextResponse.redirect(new URL(APP_PATHS.signIn, request.url), 303);
}
