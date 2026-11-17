import Link from "next/link";
import { Suspense } from "react";

import { LoadError } from "@/components/load-error";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_PATHS } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import type { CurrentUser } from "@/lib/auth/schema";
import type {
  GroupDetails,
  GroupExpense,
  MemberBalance,
  SettlementTransfer,
} from "@/lib/groups/types";
import { getJson } from "@/lib/shared/get-json";
import { parseId } from "@/lib/shared/parse-id";
import { pluralPl } from "@/lib/shared/plural";

import { BalancesTab } from "./balances-tab";
import { ExpensesTab } from "./expenses-tab";
import { GroupStats } from "./group-stats";
import { MembersTab } from "./members-tab";
import { SettlementsTab } from "./settlements-tab";

export default function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <GroupContent params={params} />
    </Suspense>
  );
}

async function GroupContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const groupId = parseId((await params).id);

  const [details, expenses, balances, settlements, me] = await Promise.all([
    getJson<GroupDetails>(API_PATHS.groups.detail(groupId), {
      notFoundOnForbidden: true,
    }),
    getJson<GroupExpense[]>(API_PATHS.groups.expenses(groupId)),
    getJson<MemberBalance[]>(API_PATHS.groups.balances(groupId)),
    getJson<SettlementTransfer[]>(API_PATHS.groups.settlements(groupId)),
    getJson<CurrentUser>(API_PATHS.users.me),
  ]);
  if (!details || !expenses || !balances || !settlements || !me) {
    return <LoadError subject="this group" />;
  }

  const myBalance = balances.find((b) => b.userId === me.id)?.netBalance ?? 0;

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <Link
          href={APP_PATHS.groups}
          className="w-fit text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          Wszystkie grupy
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {details.name}
          </h1>
          <Badge variant="secondary">
            {details.members.length}{" "}
            {pluralPl(details.members.length, "uczestnik", "uczestników", "uczestników")}
          </Badge>
        </div>
        {details.description ? (
          <p className="text-muted-foreground">{details.description}</p>
        ) : null}
      </header>

      <GroupStats
        myBalance={myBalance}
        expenseCount={expenses.length}
        settlementCount={settlements.length}
      />

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Wydatki</TabsTrigger>
          <TabsTrigger value="balances">Salda</TabsTrigger>
          <TabsTrigger value="settlements">Rozliczenia</TabsTrigger>
          <TabsTrigger value="members">Uczestnicy</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="grid gap-4 pt-4">
          <ExpensesTab
            groupId={groupId}
            members={details.members}
            expenses={expenses}
            currentUserId={me.id}
          />
        </TabsContent>
        <TabsContent value="balances" className="pt-4">
          <BalancesTab balances={balances} currentUserId={me.id} />
        </TabsContent>
        <TabsContent value="settlements" className="grid gap-3 pt-4">
          <SettlementsTab settlements={settlements} />
        </TabsContent>
        <TabsContent value="members" className="grid gap-6 pt-4">
          <MembersTab group={details} currentUserId={me.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
