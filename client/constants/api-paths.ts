import { env } from "@/configs";

export const API_PATHS = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    refresh: "/api/auth/refresh",
    logout: "/api/auth/logout",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
  },
  users: {
    me: "/api/users/me",
    password: "/api/users/me/password",
    changePassword: "/api/users/me/password",
  },
  accounts: {
    root: "/api/accounts",
    detail: (id: number) => `/api/accounts/${id}`,
    import: (id: number) => `/api/accounts/${id}/import`,
  },
  transactions: {
    root: "/api/transactions",
    category: (id: number) => `/api/transactions/${id}/category`,
    recategorize: "/api/transactions/recategorize",
  },
  categories: {
    root: "/api/categories",
    detail: (id: number) => `/api/categories/${id}`,
  },
  categorizationRules: {
    root: "/api/categorization-rules",
    detail: (id: number) => `/api/categorization-rules/${id}`,
    test: "/api/categorization-rules/test",
  },
  budgets: {
    root: "/api/budgets",
    detail: (id: number) => `/api/budgets/${id}`,
    summary: "/api/budgets/summary",
  },
  subscriptions: {
    root: "/api/subscriptions",
    summary: "/api/subscriptions/summary",
    detect: "/api/subscriptions/detect",
    dismiss: (id: number) => `/api/subscriptions/${id}/dismiss`,
  },
  analytics: {
    summary: "/api/analytics/summary",
    byCategory: "/api/analytics/by-category",
    monthly: "/api/analytics/monthly",
  },
  groups: {
    root: "/api/groups",
    detail: (groupId: number) => `/api/groups/${groupId}`,
    members: (groupId: number) => `/api/groups/${groupId}/members`,
    member: (groupId: number, userId: number) =>
      `/api/groups/${groupId}/members/${userId}`,
    expenses: (groupId: number) => `/api/groups/${groupId}/expenses`,
    balances: (groupId: number) => `/api/groups/${groupId}/balances`,
    settlements: (groupId: number) => `/api/groups/${groupId}/settlements`,
    invitations: (groupId: number) => `/api/groups/${groupId}/invitations`,
    settleSplit: (splitId: number) =>
      `/api/groups/expenses/splits/${splitId}/settle`,
  },
  invitations: {
    root: "/api/invitations",
    accept: (id: number) => `/api/invitations/${id}/accept`,
    decline: (id: number) => `/api/invitations/${id}/decline`,
  },
} as const;

export function apiUrl(path: string) {
  return `${env.NEXT_PUBLIC_API_URL}${path}`;
}
