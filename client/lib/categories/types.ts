export const CATEGORY_TYPES = ["EXPENSE", "INCOME"] as const;

export type CategoryType = (typeof CATEGORY_TYPES)[number];

export type Category = {
  id: number;
  name: string;
  type: CategoryType;
  system: boolean;
};

export const RULE_MATCH_TYPES = ["KEYWORD", "REGEX"] as const;

export type RuleMatchType = (typeof RULE_MATCH_TYPES)[number];

export const RULE_TARGETS = ["ANY", "TITLE", "COUNTERPARTY"] as const;

export type RuleTarget = (typeof RULE_TARGETS)[number];

export type CategorizationRule = {
  id: number;
  categoryId: number;
  categoryName: string;
  matchType: RuleMatchType;
  target: RuleTarget;
  pattern: string;
  priority: number;
  system: boolean;
};

export type CategorizationTestResult = {
  matched: boolean;
  category: Category | null;
  rule: CategorizationRule | null;
};

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  EXPENSE: "Wydatek",
  INCOME: "Przychód",
};

export const RULE_MATCH_TYPE_LABELS: Record<RuleMatchType, string> = {
  KEYWORD: "Słowo kluczowe",
  REGEX: "Wyrażenie regularne",
};

export const RULE_TARGET_LABELS: Record<RuleTarget, string> = {
  ANY: "Tytuł lub odbiorca",
  TITLE: "Tytuł",
  COUNTERPARTY: "Odbiorca",
};
