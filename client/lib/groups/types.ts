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

export type SettlementTransfer = {
  fromUserId: number;
  fromDisplayName: string;
  toUserId: number;
  toDisplayName: string;
  amount: number;
};
