import { formatMoney } from "@/lib/shared/format";

export type BaseCurrencyContext = {
  baseCurrency: string;
  rateToPln: number;
};

export const DEFAULT_BASE_CURRENCY_CTX: BaseCurrencyContext = {
  baseCurrency: "PLN",
  rateToPln: 1,
};

export function convertFromPln(
  amountInPln: number,
  ctx: BaseCurrencyContext,
): number {
  if (ctx.baseCurrency === "PLN" || ctx.rateToPln <= 0) {
    return amountInPln;
  }
  return amountInPln / ctx.rateToPln;
}

export function formatBaseEquivalent(
  amountInPln: number,
  ctx: BaseCurrencyContext,
  sourceCurrency = "PLN",
): string | null {
  if (ctx.baseCurrency === sourceCurrency || ctx.rateToPln <= 0) {
    return null;
  }
  return formatMoney(convertFromPln(amountInPln, ctx), ctx.baseCurrency);
}

export function formatPrimaryFromPln(
  amountInPln: number,
  ctx: BaseCurrencyContext,
): string {
  return formatMoney(convertFromPln(amountInPln, ctx), ctx.baseCurrency);
}

export function formatOriginalPln(
  amountInPln: number,
  ctx: BaseCurrencyContext,
): string | null {
  if (ctx.baseCurrency === "PLN" || ctx.rateToPln <= 0) {
    return null;
  }
  return `orig: ${formatMoney(amountInPln, "PLN")}`;
}
