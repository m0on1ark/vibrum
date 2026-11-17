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
import {
  CATEGORY_TYPE_LABELS,
  RULE_MATCH_TYPE_LABELS,
  RULE_TARGET_LABELS,
  type CategorizationRule,
  type Category,
} from "@/lib/categories/types";
import { pluralPl } from "@/lib/shared/plural";

import { deleteRuleAction } from "./actions";
import { RuleFormDialog } from "./rule-form-dialog";

export function RulesTab({
  rules,
  categories,
}: {
  rules: CategorizationRule[];
  categories: Category[];
}) {
  const { run, pending, error } = useServerAction();

  const userRules = rules.filter((r) => !r.system);
  const systemRules = rules.filter((r) => r.system);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  function handleDelete(rule: CategorizationRule) {
    if (!window.confirm(`Usunąć regułę dla wzorca „${rule.pattern}”?`)) {
      return;
    }
    run(() => deleteRuleAction(rule.id));
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">
            Łącznie {rules.length}{" "}
            {pluralPl(rules.length, "reguła", "reguły", "reguł")} (
            {userRules.length}{" "}
            {pluralPl(userRules.length, "własna", "własne", "własnych")},{" "}
            {systemRules.length}{" "}
            {pluralPl(
              systemRules.length,
              "systemowa",
              "systemowe",
              "systemowych",
            )}
            ).
          </p>
          <InlineError message={error} />
        </div>

        <RuleFormDialog
          categories={categories}
          trigger={
            <Button
              size="lg"
              className="h-11 text-base"
              disabled={categories.length === 0}
            >
              <PlusIcon className="size-4" />
              Dodaj regułę
            </Button>
          }
        />
      </div>

      <section className="grid gap-3">
        <h2 className="font-heading text-xl font-semibold">Twoje reguły</h2>
        {userRules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nie masz jeszcze własnych reguł kategoryzacji. Dodaj pierwszą
            przyciskiem powyżej.
          </p>
        ) : (
          <RulesTable
            rules={userRules}
            categories={categories}
            categoryById={categoryById}
            pending={pending}
            onDelete={handleDelete}
          />
        )}
      </section>

      <section className="grid gap-3">
        <div className="grid gap-1">
          <h2 className="font-heading text-xl font-semibold">
            Reguły systemowe
          </h2>
          <p className="text-sm text-muted-foreground">
            Wbudowane reguły są tylko do odczytu. Własne reguły mają zawsze
            pierwszeństwo przed systemowymi.
          </p>
        </div>
        {systemRules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Brak reguł systemowych.
          </p>
        ) : (
          <RulesTable
            rules={systemRules}
            categories={categories}
            categoryById={categoryById}
            pending={pending}
            onDelete={handleDelete}
          />
        )}
      </section>
    </div>
  );
}

function RulesTable({
  rules,
  categories,
  categoryById,
  pending,
  onDelete,
}: {
  rules: CategorizationRule[];
  categories: Category[];
  categoryById: Map<number, Category>;
  pending: boolean;
  onDelete: (rule: CategorizationRule) => void;
}) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Wzorzec</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Pole</TableHead>
            <TableHead>Kategoria</TableHead>
            <TableHead className="text-right">Priorytet</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => {
            const category = categoryById.get(rule.categoryId);

            return (
              <TableRow key={rule.id}>
                <TableCell className="max-w-xs whitespace-normal">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all">
                    {rule.pattern}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {RULE_MATCH_TYPE_LABELS[rule.matchType]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {RULE_TARGET_LABELS[rule.target]}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{rule.categoryName}</span>
                    {category ? (
                      <Badge variant="outline">
                        {CATEGORY_TYPE_LABELS[category.type]}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rule.priority}
                </TableCell>
                <TableCell className="text-right">
                  {rule.system ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <LockIcon className="size-3.5" />
                      Tylko do odczytu
                    </span>
                  ) : (
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <RuleFormDialog
                        rule={rule}
                        categories={categories}
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
                        onClick={() => onDelete(rule)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2Icon className="size-3.5" />
                        Usuń
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
