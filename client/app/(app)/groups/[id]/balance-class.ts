import { cn } from "@/lib/utils";

export function balanceClass(value: number) {
  return cn(value > 0 && "text-emerald-600", value < 0 && "text-destructive");
}
