import { z } from "zod";

const email = z.email("Podaj poprawny adres email");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Podaj hasło").max(72, "Hasło jest za długie"),
});

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Podaj imię")
    .max(100, "Imię może mieć maksymalnie 100 znaków"),
  email,
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .max(72, "Hasło może mieć maksymalnie 72 znaki"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

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
