"use server";

import { isProduction } from "@/configs";
import { cookies } from "next/headers";

const ACCESS_TOKEN = "accessToken";
const REFRESH_TOKEN = "refreshToken";

export async function setAccessToken(accessToken: string, expiresIn: number) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN, accessToken, {
    httpOnly: true,
    path: "/",
    secure: isProduction,
    sameSite: "lax",
    maxAge: expiresIn,
  });
}

export async function hasAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.has(ACCESS_TOKEN);
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN);
  cookieStore.delete(REFRESH_TOKEN);
}
