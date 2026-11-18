import { API_PATHS } from "@/constants/api-paths";
import type { CurrentUser } from "@/lib/auth/schema";
import { getJson } from "@/lib/shared/get-json";

import {
  DEFAULT_BASE_CURRENCY_CTX,
  type BaseCurrencyContext,
} from "./base-currency";

type CurrencyRateResponse = {
  currency: string;
  rateToPln: number;
  asOfDate?: string;
};

export async function getUserBaseCurrencyContext(): Promise<BaseCurrencyContext> {
  const user = await getJson<CurrentUser>(API_PATHS.users.me);
  const code = user?.baseCurrency?.trim().toUpperCase();
  if (!code || code === "PLN") {
    return DEFAULT_BASE_CURRENCY_CTX;
  }

  const rate = await getJson<CurrencyRateResponse>(
    API_PATHS.currencies.rate(code),
  );
  if (!rate || typeof rate.rateToPln !== "number" || rate.rateToPln <= 0) {
    return DEFAULT_BASE_CURRENCY_CTX;
  }

  return {
    baseCurrency: code,
    rateToPln: rate.rateToPln,
  };
}
