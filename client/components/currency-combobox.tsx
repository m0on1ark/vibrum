"use client";

import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CURRENCIES,
  ENABLED_CURRENCY_CODES,
  type CurrencyCode,
} from "@/constants/currencies";
import { cn } from "@/lib/utils";

export function CurrencyCombobox({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (currency) =>
        currency.code.toLowerCase().includes(q) ||
        currency.name.toLowerCase().includes(q),
    );
  }, [query]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  return (
    // modal: inside a Dialog the portaled list otherwise loses wheel scrolling
    <Popover modal open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value}
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 gap-0 p-0" align="start">
        <div className="relative border-b p-1.5">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Szukaj waluty..."
            className="h-8 pl-8 shadow-none"
          />
        </div>
        <div
          role="listbox"
          className="max-h-64 overflow-y-auto overscroll-contain p-1"
        >
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nie znaleziono waluty.
            </p>
          ) : (
            filtered.map((currency) => {
              const enabled = ENABLED_CURRENCY_CODES.includes(currency.code);
              const selected = value === currency.code;
              return (
                <button
                  key={currency.code}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={!enabled}
                  onClick={() => {
                    onChange(currency.code);
                    handleOpenChange(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="font-medium">{currency.code}</span>
                  <span className="truncate text-muted-foreground">
                    {currency.name}
                  </span>
                  {enabled ? (
                    <CheckIcon
                      className={cn(
                        "ml-auto size-4 shrink-0",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  ) : (
                    <span className="ml-auto text-xs text-muted-foreground">
                      wkrótce
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
