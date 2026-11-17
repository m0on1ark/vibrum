export const APP_PATHS = {
  home: "/",
  transactions: "/transactions",
  categories: "/categories",
  groups: "/groups",
  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  sessionExpired: "/auth/expired",
  changePassword: "/account/password",
} as const;

export const GUEST_ONLY_PATHS: string[] = [APP_PATHS.signIn, APP_PATHS.signUp];

export const AUTH_PATH_PREFIX = "/auth/";
