import { z } from "zod";

const email = z.email("Enter a valid email address");

const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

const confirmPassword = z.string().min(1, "Confirm your password");

function passwordsMatch(data: { newPassword: string; confirmPassword: string }) {
  return data.newPassword === data.confirmPassword;
}

const passwordsMatchIssue = {
  message: "Passwords do not match",
  path: ["confirmPassword"],
};

export const signInSchema = z.object({
  email,
  password: z
    .string()
    .min(1, "Enter your password")
    .max(72, "Password is too long"),
});

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(100, "Name must be at most 100 characters"),
  email,
  password: newPassword,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ newPassword, confirmPassword })
  .refine(passwordsMatch, passwordsMatchIssue);

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword,
    confirmPassword,
  })
  .refine(passwordsMatch, passwordsMatchIssue);

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type AuthTokenResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

export type CurrentUser = {
  id: number;
  email: string;
  displayName: string;
  baseCurrency: string;
  role: string;
};
