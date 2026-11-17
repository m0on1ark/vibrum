"use server";

import { APP_PATHS } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import { callApi } from "@/lib/shared/call-api";

export async function acceptInvitationAction(id: number) {
  const { error } = await callApi(API_PATHS.invitations.accept(id), {
    revalidate: [APP_PATHS.notifications, APP_PATHS.groups],
  });
  return { error };
}

export async function declineInvitationAction(id: number) {
  const { error } = await callApi(API_PATHS.invitations.decline(id), {
    revalidate: [APP_PATHS.notifications],
  });
  return { error };
}
