import Link from "next/link";
import { Suspense } from "react";

import { LoadError } from "@/components/load-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_PATHS } from "@/constants";
import { API_PATHS } from "@/constants/api-paths";
import type { CategorizationRule, Category } from "@/lib/categories/types";
import { getJson } from "@/lib/shared/get-json";

import { CategoriesTab } from "./categories-tab";
import { RuleTester } from "./rule-tester";
import { RulesTab } from "./rules-tab";

export default function CategoriesPage() {
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Kategorie i reguły
          </h1>
          <p className="text-muted-foreground">
            Zarządzaj kategoriami transakcji oraz regułami automatycznej
            kategoryzacji.
          </p>
        </div>
        <Button asChild variant="outline" size="lg" className="h-11 text-base">
          <Link href={APP_PATHS.transactions}>Transakcje</Link>
        </Button>
      </header>

      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <CategoriesContent />
      </Suspense>
    </div>
  );
}

async function CategoriesContent() {
  const [categories, rules] = await Promise.all([
    getJson<Category[]>(API_PATHS.categories.root),
    getJson<CategorizationRule[]>(API_PATHS.categorizationRules.root),
  ]);

  if (!categories) return <LoadError subject="categories" />;
  if (!rules) return <LoadError subject="categorization rules" />;

  return (
    <Tabs defaultValue="categories">
      <TabsList>
        <TabsTrigger value="categories">
          Kategorie ({categories.length})
        </TabsTrigger>
        <TabsTrigger value="rules">
          Reguły kategoryzacji ({rules.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="categories" className="pt-4">
        <CategoriesTab categories={categories} />
      </TabsContent>

      <TabsContent value="rules" className="grid gap-8 pt-4">
        <RuleTester />
        <RulesTab rules={rules} categories={categories} />
      </TabsContent>
    </Tabs>
  );
}
