export const SPLIT_MODE_LABELS = {
  EQUAL: "Równo",
  PERCENT: "Procentowo",
  FIXED: "Kwotowo",
} as const;

export const SPLIT_MODES = Object.keys(
  SPLIT_MODE_LABELS,
) as (keyof typeof SPLIT_MODE_LABELS)[];
