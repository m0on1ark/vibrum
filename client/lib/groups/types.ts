export type SplitMode = "EQUAL" | "PERCENT" | "FIXED";

export type GroupSummary = {
  id: number;
  name: string;
  description: string | null;
  createdById: number;
  memberCount: number;
  createdAt: string;
};

export type GroupMember = {
  userId: number;
  email: string;
  displayName: string;
  joinedAt: string;
};

export type GroupDetails = {
  id: number;
  name: string;
  description: string | null;
  createdById: number;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
};

export type SplitLine = {
  splitId: number;
  userId: number;
  displayName: string;
  shareAmount: number;
  sharePercent: number | null;
  shareAmountInPln: number;
  settled: boolean;
};

export type GroupExpense = {
  id: number;
  groupId: number;
  paidById: number;
  paidByDisplayName: string;
  title: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInPln: number;
  expenseDate: string;
  splitMode: SplitMode;
  splits: SplitLine[];
  createdAt: string;
};

export type MemberBalance = {
  userId: number;
  displayName: string;
  email: string;
  netBalance: number;
};

export type GroupInvitation = {
  id: number;
  groupId: number;
  groupName: string;
  invitedByDisplayName: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  createdAt: string;
  expiresAt: string | null;
};

export function isInvitationActive(invitation: GroupInvitation, now = Date.now()) {
  if (invitation.status !== "PENDING") return false;
  if (!invitation.expiresAt) return true;
  return Date.parse(invitation.expiresAt) > now;
}

export type SettlementTransfer = {
  fromUserId: number;
  fromDisplayName: string;
  toUserId: number;
  toDisplayName: string;
  amount: number;
};

export type PaymentDetails = {
  toUserId: number;
  recipientName: string;
  iban: string | null;
  amount: number;
  currency: string;
  title: string;
  qrPayload: string | null;
};

export function formatPolishIban(iban: string): string {
  const compact = iban.replace(/\s+/g, "").toUpperCase();
  return compact.replace(/(.{4})(?=.)/g, "$1 ");
}
