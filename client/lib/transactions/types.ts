import { APP_PATHS } from "@/constants";

export type Transaction = {
  id: number;
  accountId: number;
  accountName: string;
  date: string;
  amount: number;
  currency: string;
  amountInPln: number;
  title: string;
  recipient: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryManual: boolean;
};

export type RecategorizeResult = {
  checkedCount: number;
  changedCount: number;
};

export type RawSpringPage<T> = {
  content: T[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
  page?: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
};

export type NormalizedPage<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export function normalizePage<T>(raw: RawSpringPage<T>): NormalizedPage<T> {
  const number = raw.page?.number ?? raw.number ?? 0;
  const size = raw.page?.size ?? raw.size ?? 20;
  const totalElements =
    raw.page?.totalElements ?? raw.totalElements ?? raw.content.length;
  const totalPages =
    raw.page?.totalPages ??
    raw.totalPages ??
    Math.max(1, Math.ceil(totalElements / Math.max(1, size)));

  return {
    content: raw.content,
    number,
    size,
    totalElements,
    totalPages,
    first: raw.first ?? number <= 0,
    last: raw.last ?? number >= totalPages - 1,
  };
}

export const TRANSACTION_SORT_OPTIONS = [
  { value: "transactionDate,desc", label: "Data (od najnowszych)" },
  { value: "transactionDate,asc", label: "Data (od najstarszych)" },
  { value: "amountInPln,asc", label: "Kwota PLN (rosnąco)" },
  { value: "amountInPln,desc", label: "Kwota PLN (malejąco)" },
  { value: "title,asc", label: "Tytuł (A–Z)" },
  { value: "title,desc", label: "Tytuł (Z–A)" },
] as const;

export type TransactionSort =
  (typeof TRANSACTION_SORT_OPTIONS)[number]["value"];

export const TRANSACTION_PAGE_SIZES = [10, 20, 50] as const;

export type TransactionFilters = {
  startDate: string;
  endDate: string;
  categoryId: number | null;
  accountId: number | null;
  page: number;
  size: number;
  sort: TransactionSort;
};

export const DEFAULT_TRANSACTION_SORT: TransactionSort = "transactionDate,desc";
export const DEFAULT_TRANSACTION_PAGE_SIZE = 20;

const VALID_SORTS = new Set<string>(
  TRANSACTION_SORT_OPTIONS.map((option) => option.value),
);
const VALID_SIZES = new Set<number>(TRANSACTION_PAGE_SIZES);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function singleParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseNonNegativeInt(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function parseIsoDate(value: string | undefined): string {
  if (!value || !ISO_DATE_RE.test(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }
  return value;
}

export function parseTransactionSearchParams(
  raw: Record<string, string | string[] | undefined>,
): TransactionFilters {
  const sortRaw = singleParam(raw.sort);
  const sizeRaw = Number(singleParam(raw.size));

  return {
    startDate: parseIsoDate(singleParam(raw.startDate)),
    endDate: parseIsoDate(singleParam(raw.endDate)),
    categoryId: parsePositiveInt(singleParam(raw.categoryId)),
    accountId: parsePositiveInt(singleParam(raw.accountId)),
    page: parseNonNegativeInt(singleParam(raw.page)),
    size: VALID_SIZES.has(sizeRaw) ? sizeRaw : DEFAULT_TRANSACTION_PAGE_SIZE,
    sort:
      sortRaw && VALID_SORTS.has(sortRaw)
        ? (sortRaw as TransactionSort)
        : DEFAULT_TRANSACTION_SORT,
  };
}

export function buildTransactionQuery(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.categoryId != null) {
    params.set("categoryId", String(filters.categoryId));
  }
  if (filters.accountId != null) {
    params.set("accountId", String(filters.accountId));
  }
  if (filters.page > 0) params.set("page", String(filters.page));
  if (filters.size !== DEFAULT_TRANSACTION_PAGE_SIZE) {
    params.set("size", String(filters.size));
  }
  if (filters.sort !== DEFAULT_TRANSACTION_SORT) {
    params.set("sort", filters.sort);
  }
  return params.toString();
}

export function buildTransactionsHref(filters: TransactionFilters): string {
  const query = buildTransactionQuery(filters);
  return query ? `${APP_PATHS.transactions}?${query}` : APP_PATHS.transactions;
}

export function hasActiveTransactionFilters(
  filters: TransactionFilters,
): boolean {
  return Boolean(
    filters.startDate ||
      filters.endDate ||
      filters.categoryId != null ||
      filters.accountId != null ||
      filters.size !== DEFAULT_TRANSACTION_PAGE_SIZE ||
      filters.sort !== DEFAULT_TRANSACTION_SORT,
  );
}
