"use client";

import { LockIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { InlineError } from "@/components/inline-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useServerAction } from "@/hooks/use-server-action";
import { CATEGORY_TYPE_LABELS, type Category } from "@/lib/categories/types";
import { pluralPl } from "@/lib/shared/plural";

import { deleteCategoryAction } from "./actions";
import { CategoryFormDialog } from "./category-form-dialog";

export function CategoriesTab({ categories }: { categories: Category[] }) {
  const { run, pending, error } = useServerAction();

  const userCategories = categories.filter((c) => !c.system);
  const systemCategories = categories.filter((c) => c.system);

  function handleDelete(category: Category) {
    if (
      !window.confirm(
        `Usunąć kategorię „${category.name}”? Powiązane transakcje i reguły mogą utracić tę kategorię.`,
      )
    ) {
      return;
    }
    run(() => deleteCategoryAction(category.id));
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">
            Łącznie {categories.length}{" "}
            {pluralPl(categories.length, "kategoria", "kategorie", "kategorii")}{" "}
            ({userCategories.length}{" "}
            {pluralPl(userCategories.length, "własna", "własne", "własnych")},{" "}
            {systemCategories.length}{" "}
            {pluralPl(
              systemCategories.length,
              "systemowa",
              "systemowe",
              "systemowych",
            )}
            ).
          </p>
          <InlineError message={error} />
        </div>

        <CategoryFormDialog
          trigger={
            <Button size="lg" className="h-11 text-base">
              <PlusIcon className="size-4" />
              Dodaj kategorię
            </Button>
          }
        />
      </div>

      <section className="grid gap-3">
        <h2 className="font-heading text-xl font-semibold">Twoje kategorie</h2>
        {userCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nie masz jeszcze własnych kategorii. Dodaj pierwszą przyciskiem
            powyżej.
          </p>
        ) : (
          <CategoriesTable
            categories={userCategories}
            pending={pending}
            onDelete={handleDelete}
          />
        )}
      </section>

      <section className="grid gap-3">
        <div className="grid gap-1">
          <h2 className="font-heading text-xl font-semibold">
            Kategorie systemowe
          </h2>
          <p className="text-sm text-muted-foreground">
            Wbudowane kategorie są dostępne automatycznie i nie można ich
            edytować ani usuwać.
          </p>
        </div>
        {systemCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Brak kategorii systemowych.
          </p>
        ) : (
          <CategoriesTable
            categories={systemCategories}
            pending={pending}
            onDelete={handleDelete}
          />
        )}
      </section>
    </div>
  );
}

function CategoriesTable({
  categories,
  pending,
  onDelete,
}: {
  categories: Category[];
  pending: boolean;
  onDelete: (category: Category) => void;
}) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Pochodzenie</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>
                <Badge
                  variant={category.type === "INCOME" ? "default" : "secondary"}
                >
                  {CATEGORY_TYPE_LABELS[category.type]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {category.system ? "Systemowa" : "Własna"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {category.system ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LockIcon className="size-3.5" />
                    Tylko do odczytu
                  </span>
                ) : (
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <CategoryFormDialog
                      category={category}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={pending}
                        >
                          <PencilIcon className="size-3.5" />
                          Edytuj
                        </Button>
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => onDelete(category)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2Icon className="size-3.5" />
                      Usuń
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
