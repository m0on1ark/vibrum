import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE);

  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token.value}`);
  }

  const response = await fetch(url, { ...options, headers, cache: "no-store" });

  if (response.status === 401 && isTokenRejection(response)) {
    try {
      cookieStore.delete(ACCESS_TOKEN_COOKIE);
    } catch {
      // Cookie writes are only allowed in a Server Action or Route Handler.
    }
  }

  return response;
}

// An invalid or expired JWT is rejected by Spring Security with an empty body, while
// business 401s (for example a wrong current password) carry a JSON problem detail.
export function isTokenRejection(response: Response) {
  return !response.headers.get("content-type")?.includes("json");
}
