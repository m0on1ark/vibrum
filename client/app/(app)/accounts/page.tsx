import Link from "next/link";
import { Suspense } from "react";

import { LoadError } from "@/components/load-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PATHS } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import { BANK_TYPE_LABELS, type BankAccount } from "@/lib/accounts/types";
import { getJson } from "@/lib/shared/get-json";

import { AccountActions } from "./account-actions";
import { CreateAccountForm } from "./create-account-form";
import { ImportStatementForm } from "./import-statement-form";

export default function AccountsPage() {
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Konta bankowe
          </h1>
          <p className="text-muted-foreground">
            Dodawaj konta i importuj wyciągi w formatach PKO BP (CSV), mBank
            (CSV) oraz Revolut (JSON).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="lg" className="h-11 text-base">
            <Link href={APP_PATHS.transactions}>Wszystkie transakcje</Link>
          </Button>
          <CreateAccountForm />
        </div>
      </header>

      <Suspense fallback={<Skeleton className="h-44 w-full" />}>
        <AccountsList />
      </Suspense>
    </div>
  );
}

async function AccountsList() {
  const accounts = await getJson<BankAccount[]>(API_PATHS.accounts.root);
  if (!accounts) return <LoadError subject="accounts" />;

  if (accounts.length === 0) {
    return (
      <p className="text-muted-foreground">
        Nie masz jeszcze żadnego konta bankowego. Utwórz pierwsze przyciskiem
        powyżej.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {accounts.map((account) => (
        <Card key={account.id} className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <CardTitle>{account.accountName}</CardTitle>
                <CardDescription>
                  <Link
                    href={`${APP_PATHS.transactions}?accountId=${account.id}`}
                    className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                  >
                    Zobacz transakcje
                  </Link>
                </CardDescription>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge variant="secondary">
                  {BANK_TYPE_LABELS[account.bankType]}
                </Badge>
                <Badge variant="outline">{account.baseCurrency}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ImportStatementForm
              accountId={account.id}
              bankType={account.bankType}
            />
          </CardContent>
          <CardFooter className="justify-end">
            <AccountActions
              accountId={account.id}
              accountName={account.accountName}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
