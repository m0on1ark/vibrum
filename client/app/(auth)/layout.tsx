import { Brand } from "@/components/auth/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-1 flex-col items-center justify-center gap-10 px-6 py-10">
      <Brand className="text-primary" />
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
