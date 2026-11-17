import { ChangePasswordForm } from "./change-password-form";

export default function ChangePasswordPage() {
  return (
    <div className="mx-auto grid w-full max-w-sm gap-8">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Zmień hasło
        </h1>
        <p className="text-muted-foreground">
          Po zmianie hasła wylogujemy Cię ze wszystkich urządzeń.
        </p>
      </header>
      <ChangePasswordForm />
    </div>
  );
}
