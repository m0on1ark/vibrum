"use server";

import { INVALID_INPUTS_MESSAGE } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import { createGroupSchema, type CreateGroupInput } from "@/lib/groups/schema";
import type { GroupDetails } from "@/lib/groups/types";
import { callApi } from "@/lib/shared/call-api";

export async function createGroupAction(input: CreateGroupInput) {
  const parsed = createGroupSchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUTS_MESSAGE, id: null };

  const result = await callApi(API_PATHS.groups.root, {
    body: {
      name: parsed.data.name,
      description: parsed.data.description || null,
    },
  });
  if (!result.ok) return { error: result.error, id: null };

  const group = (await result.response.json()) as GroupDetails;
  return { error: null, id: group.id };
}
