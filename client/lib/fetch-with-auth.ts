import { cookies } from "next/headers";

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");

  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token.value}`);
  }

  const response = await fetch(url, { ...options, headers, cache: "no-store" });

  if (response.status === 401) {
    try {
      cookieStore.delete("accessToken");
    } catch {
      // Cookie writes are only allowed in a Server Action or Route Handler.
    }
  }

  return response;
}
