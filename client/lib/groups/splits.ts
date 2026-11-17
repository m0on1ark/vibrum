import type { CreateExpenseInput, SplitEntryInput } from "./schema";

export function buildSplits(
  values: CreateExpenseInput,
  members: { userId: number }[],
  entries: Record<number, string>,
): SplitEntryInput[] | string {
  if (values.splitMode === "EQUAL") return [];

  const splits: SplitEntryInput[] = [];
  for (const member of members) {
    const raw = entries[member.userId]?.trim();
    if (!raw) continue;
    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value) || value < 0) {
      return "Split values must be valid numbers.";
    }
    if (value > 0) {
      splits.push(
        values.splitMode === "PERCENT"
          ? { userId: member.userId, percent: value }
          : { userId: member.userId, amount: value },
      );
    }
  }

  if (splits.length === 0) return "Fill in at least one split value.";

  const sum = splits.reduce(
    (total, split) => total + (split.percent ?? split.amount ?? 0),
    0,
  );
  if (values.splitMode === "PERCENT" && Math.abs(sum - 100) > 0.01) {
    return "Percentages must sum to 100.";
  }
  if (values.splitMode === "FIXED" && Math.abs(sum - values.amount) > 0.01) {
    return "Amounts must sum to the expense total.";
  }
  return splits;
}
