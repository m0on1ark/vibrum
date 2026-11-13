import { clearAuthCookies } from "@/lib/server-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await clearAuthCookies();
  return NextResponse.redirect(new URL("/auth/sign-in", request.url), 303);
}

export async function GET(request: Request) {
  await clearAuthCookies();
  return NextResponse.redirect(new URL("/auth/sign-in", request.url), 303);
}
