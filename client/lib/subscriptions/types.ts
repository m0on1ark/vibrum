export type BillingPeriod = "WEEKLY" | "MONTHLY" | "YEARLY";

export type Subscription = {
  id: number;
  merchant: string;
  amount: number;
  currency: string;
  billingPeriod: BillingPeriod;
  occurrences: number;
  lastPaymentDate: string;
  nextPaymentDate: string;
  categoryId: number | null;
  categoryName: string | null;
};

export type SubscriptionTotal = {
  currency: string;
  count: number;
  monthlyCost: number;
  yearlyCost: number;
};

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  WEEKLY: "Tygodniowo",
  MONTHLY: "Miesięcznie",
  YEARLY: "Rocznie",
};
