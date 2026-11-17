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
    changePassword: "/api/users/me/password",
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
