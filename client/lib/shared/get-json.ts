import { notFound, redirect } from "next/navigation";

import { APP_PATHS } from "@/constants";
import { apiUrl } from "@/constants/api-paths";

import { fetchWithAuth } from "./fetch-with-auth";

export async function getJson<T>(
  path: string,
  { notFoundOnForbidden = false }: { notFoundOnForbidden?: boolean } = {},
): Promise<T | null> {
  let response: Response;
  try {
    response = await fetchWithAuth(apiUrl(path));
  } catch {
    return null;
  }

  if (response.status === 401) redirect(APP_PATHS.sessionExpired);
  if (notFoundOnForbidden && (response.status === 403 || response.status === 404)) {
    notFound();
  }
  if (!response.ok) return null;

  return (await response.json()) as T;
}
