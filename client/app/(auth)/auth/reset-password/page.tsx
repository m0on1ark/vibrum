import { Suspense } from "react";

import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage({
  searchParams,
}: PageProps<"/auth/reset-password">) {
  return (
    <Suspense>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResetPasswordContent({
  searchParams,
}: Pick<PageProps<"/auth/reset-password">, "searchParams">) {
  const { token } = await searchParams;
  return (
    <ResetPasswordForm token={typeof token === "string" ? token : undefined} />
  );
}
