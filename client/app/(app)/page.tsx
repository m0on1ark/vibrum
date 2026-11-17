import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/constants";
import { API_PATHS, apiUrl } from "@/constants/api-paths";
import type { CurrentUser } from "@/lib/auth/schema";
import { fetchWithAuth } from "@/lib/shared/fetch-with-auth";

export default function HomePage() {
  return (
    <Suspense fallback={<Skeleton className="h-24 w-full max-w-md" />}>
      <Welcome />
    </Suspense>
  );
}

async function Welcome() {
  let response: Response;
  try {
    response = await fetchWithAuth(apiUrl(API_PATHS.users.me));
  } catch {
    return <LoadError />;
  }

  if (response.status === 401) redirect(APP_PATHS.sessionExpired);
  if (!response.ok) return <LoadError />;

  const user = (await response.json()) as CurrentUser;

  return <p className="text-muted-foreground">{user.displayName}</p>;
}

function LoadError() {
  return (
    <Alert variant="destructive" className="max-w-md">
      <AlertDescription>
        Could not load account details. Refresh the page in a moment.
      </AlertDescription>
    </Alert>
  );
}
