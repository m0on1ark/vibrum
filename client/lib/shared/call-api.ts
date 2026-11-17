import { revalidatePath } from "next/cache";

import { apiUrl } from "@/constants/api-paths";

import { readApiError } from "./api-error";
import { fetchWithAuth } from "./fetch-with-auth";

type CallApiResult =
  | { ok: false; error: string; response: null }
  | { ok: true; error: null; response: Response };

export async function callApi(
  path: string,
  {
    method = "POST",
    body,
    revalidate = [],
  }: { method?: string; body?: unknown; revalidate?: string[] } = {},
): Promise<CallApiResult> {
  const response = await fetchWithAuth(apiUrl(path), {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    return { ok: false, error: await readApiError(response), response: null };
  }

  for (const target of revalidate) revalidatePath(target);
  return { ok: true, error: null, response };
}
