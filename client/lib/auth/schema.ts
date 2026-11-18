import { z } from "zod";

const email = z.email("Enter a valid email address");

const displayName = z
  .string()
  .trim()
  .min(1, "Enter your name")
  .max(100, "Name must be at most 100 characters");

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
  displayName,
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

export const updateProfileSchema = z.object({
  displayName,
  baseCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Select a valid 3-letter currency code"),
  iban: z
    .string()
    .trim()
    .max(50, "IBAN must be at most 50 characters")
    .refine(
      (val) => val === "" || /^(PL)?\d{26}$/i.test(val.replace(/[\s-]/g, "")),
      "Enter a valid Polish IBAN (26 digits, optional PL prefix)",
    ),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

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
  iban?: string | null;
  role: string;
};
