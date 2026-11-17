"use server";

import { APP_PATHS, INVALID_INPUTS_MESSAGE } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import {
  createExpenseSchema,
  inviteMemberSchema,
  type CreateExpenseInput,
  type InviteMemberInput,
  type SplitEntryInput,
} from "@/lib/groups/schema";
import { callApi } from "@/lib/shared/call-api";

function groupPath(groupId: number) {
  return `${APP_PATHS.groups}/${groupId}`;
}

export async function inviteMemberAction(
  groupId: number,
  input: InviteMemberInput,
) {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUTS_MESSAGE };

  const { error } = await callApi(API_PATHS.groups.invitations(groupId), {
    body: parsed.data,
  });
  return { error };
}

export async function removeMemberAction(groupId: number, userId: number) {
  const { error } = await callApi(API_PATHS.groups.member(groupId, userId), {
    method: "DELETE",
    revalidate: [groupPath(groupId)],
  });
  return { error };
}

export async function addExpenseAction(
  groupId: number,
  input: CreateExpenseInput & { splits?: SplitEntryInput[] },
) {
  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUTS_MESSAGE };

  const { error } = await callApi(API_PATHS.groups.expenses(groupId), {
    body: {
      ...parsed.data,
      splits: input.splits?.length ? input.splits : null,
    },
    revalidate: [groupPath(groupId)],
  });
  return { error };
}

export async function settleSplitAction(groupId: number, splitId: number) {
  const { error } = await callApi(API_PATHS.groups.settleSplit(splitId), {
    method: "PATCH",
    revalidate: [groupPath(groupId)],
  });
  return { error };
}
