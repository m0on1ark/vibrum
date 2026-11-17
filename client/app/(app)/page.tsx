import { Suspense } from "react";

import { LoadError } from "@/components/load-error";
import { Skeleton } from "@/components/ui/skeleton";
import { API_PATHS } from "@/constants/api-paths";
import type { CurrentUser } from "@/lib/auth/schema";
import { getJson } from "@/lib/shared/get-json";

export default function HomePage() {
  return (
    <Suspense fallback={<Skeleton className="h-24 w-full max-w-md" />}>
      <Welcome />
    </Suspense>
  );
}

async function Welcome() {
  const user = await getJson<CurrentUser>(API_PATHS.users.me);
  if (!user) return <LoadError subject="account details" />;

  return <p className="text-muted-foreground">{user.displayName}</p>;
}
