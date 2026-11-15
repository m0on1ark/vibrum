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
} as const;

export function apiUrl(path: string) {
  return `${env.NEXT_PUBLIC_API_URL}${path}`;
}
