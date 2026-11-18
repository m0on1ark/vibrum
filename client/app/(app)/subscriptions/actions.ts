"use server";

import { APP_PATHS, INVALID_INPUTS_MESSAGE } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import { callApi } from "@/lib/shared/call-api";

const SUBSCRIPTIONS_REVALIDATE = [APP_PATHS.subscriptions];

export async function detectSubscriptionsAction(): Promise<{
  error: string | null;
}> {
  const { error } = await callApi(API_PATHS.subscriptions.detect, {
    method: "POST",
    revalidate: SUBSCRIPTIONS_REVALIDATE,
  });
  return { error };
}

export async function dismissSubscriptionAction(
  id: number,
): Promise<{ error: string | null }> {
  if (!Number.isInteger(id) || id <= 0) {
    return { error: INVALID_INPUTS_MESSAGE };
  }

  const { error } = await callApi(API_PATHS.subscriptions.dismiss(id), {
    method: "POST",
    revalidate: SUBSCRIPTIONS_REVALIDATE,
  });
  return { error };
}
