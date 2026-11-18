import { LogOut } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { signOutAction } from "@/app/(app)/actions";
import { LoadError } from "@/components/load-error";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import type { CurrentUser } from "@/lib/auth/schema";
import { getJson } from "@/lib/shared/get-json";

import { ProfileForm } from "./profile-form";

export default function ProfilePage() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-8">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Profil
        </h1>
        <p className="text-muted-foreground">
          Zarządzaj danymi swojego konta i bezpieczeństwem.
        </p>
      </header>

      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}

async function ProfileContent() {
  const user = await getJson<CurrentUser>(API_PATHS.users.me);
  if (!user) return <LoadError subject="profile" />;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Dane konta</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bezpieczeństwo</CardTitle>
          <CardDescription>
            Zmień hasło do swojego konta, aby chronić dostęp do danych.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={APP_PATHS.changePassword}>Zmień hasło</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sesja</CardTitle>
          <CardDescription>
            Zakończ bieżącą sesję i wyloguj się ze swojego konta na tym urządzeniu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOutAction}>
            <Button type="submit" variant="destructive">
              <LogOut className="size-4" />
              Wyloguj się
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
