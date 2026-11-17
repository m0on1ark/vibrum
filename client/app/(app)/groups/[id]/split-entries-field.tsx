"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SplitEntriesField({
  mode,
  members,
  entries,
  onChange,
}: {
  mode: "PERCENT" | "FIXED";
  members: { userId: number; displayName: string }[];
  entries: Record<number, string>;
  onChange: (userId: number, value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel>
        {mode === "PERCENT" ? "Udziały procentowe" : "Kwoty udziałów"}
      </FieldLabel>
      <div className="grid gap-2">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-sm">{member.displayName}</span>
            <Input
              inputMode="decimal"
              className="w-28"
              placeholder={mode === "PERCENT" ? "%" : "0.00"}
              value={entries[member.userId] ?? ""}
              onChange={(event) => onChange(member.userId, event.target.value)}
            />
          </div>
        ))}
      </div>
    </Field>
  );
}
