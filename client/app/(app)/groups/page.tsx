import Link from "next/link";
import { Suspense } from "react";

import { APP_PATHS } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import { LoadError } from "@/components/load-error";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/shared/format";
import { getJson } from "@/lib/shared/get-json";
import { pluralPl } from "@/lib/shared/plural";
import type { GroupSummary } from "@/lib/groups/types";

import { CreateGroupForm } from "./create-group-form";

export default function GroupsPage() {
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Grupy
          </h1>
          <p className="text-muted-foreground">
            Wspólne wydatki i rozliczenia ze znajomymi.
          </p>
        </div>
        <CreateGroupForm />
      </header>

      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <GroupsList />
      </Suspense>
    </div>
  );
}

async function GroupsList() {
  const groups = await getJson<GroupSummary[]>(API_PATHS.groups.root);
  if (!groups) return <LoadError subject="groups" />;

  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground">
        Nie należysz jeszcze do żadnej grupy. Utwórz pierwszą przyciskiem
        powyżej.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((group) => (
        <Link key={group.id} href={`${APP_PATHS.groups}/${group.id}`}>
          <Card className="h-full transition-colors hover:bg-accent/50">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{group.name}</CardTitle>
                <Badge variant="secondary">
                  {group.memberCount}{" "}
                  {pluralPl(group.memberCount, "osoba", "osoby", "osób")}
                </Badge>
              </div>
              {group.description ? (
                <CardDescription>{group.description}</CardDescription>
              ) : null}
              <CardDescription>
                Utworzona {formatDate(group.createdAt)}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
