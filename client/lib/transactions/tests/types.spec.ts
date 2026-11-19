import {
  DEFAULT_TRANSACTION_PAGE_SIZE,
  DEFAULT_TRANSACTION_SORT,
  buildTransactionQuery,
  buildTransactionsHref,
  hasActiveTransactionFilters,
  normalizePage,
  parseTransactionSearchParams,
  type TransactionFilters,
} from "../types";

describe("transactions types and query helpers", () => {
  describe("parseTransactionSearchParams (including ISO date validation)", () => {
    it("returns defaults when search params are empty", () => {
      expect(parseTransactionSearchParams({})).toEqual({
        startDate: "",
        endDate: "",
        categoryId: null,
        accountId: null,
        page: 0,
        size: DEFAULT_TRANSACTION_PAGE_SIZE,
        sort: DEFAULT_TRANSACTION_SORT,
      });
    });

    it("accepts valid ISO dates including leap-year Feb 29", () => {
      const parsed = parseTransactionSearchParams({
        startDate: "2024-02-29",
        endDate: "2026-11-19",
      });
      expect(parsed.startDate).toBe("2024-02-29");
      expect(parsed.endDate).toBe("2026-11-19");
    });

    it.each([
      "2026-02-30",
      "2025-02-29",
      "2026-99-99",
      "2026-04-31",
      "not-a-date",
      "2026/05/01",
      "2026-5-1",
    ])("rejects invalid date %j", (invalidDate) => {
      const parsed = parseTransactionSearchParams({
        startDate: invalidDate,
        endDate: invalidDate,
      });
      expect(parsed.startDate).toBe("");
      expect(parsed.endDate).toBe("");
    });

    it("parses valid positive IDs, page, size, sort, and array values", () => {
      const parsed = parseTransactionSearchParams({
        startDate: ["2026-01-01", "2026-02-01"],
        categoryId: "7",
        accountId: "12",
        page: "3",
        size: "50",
        sort: "amountInPln,asc",
      });
      expect(parsed).toEqual({
        startDate: "2026-01-01",
        endDate: "",
        categoryId: 7,
        accountId: 12,
        page: 3,
        size: 50,
        sort: "amountInPln,asc",
      });
    });

    it("falls back safely on invalid numeric, size, and sort parameters", () => {
      const parsed = parseTransactionSearchParams({
        categoryId: "0",
        accountId: "-5",
        page: "-2",
        size: "25",
        sort: "unknown,desc",
      });
      expect(parsed).toEqual({
        startDate: "",
        endDate: "",
        categoryId: null,
        accountId: null,
        page: 0,
        size: DEFAULT_TRANSACTION_PAGE_SIZE,
        sort: DEFAULT_TRANSACTION_SORT,
      });
    });
  });

  describe("buildTransactionQuery and buildTransactionsHref", () => {
    const defaultFilters: TransactionFilters = {
      startDate: "",
      endDate: "",
      categoryId: null,
      accountId: null,
      page: 0,
      size: DEFAULT_TRANSACTION_PAGE_SIZE,
      sort: DEFAULT_TRANSACTION_SORT,
    };

    it("returns empty query and base href for default filters", () => {
      expect(buildTransactionQuery(defaultFilters)).toBe("");
      expect(buildTransactionsHref(defaultFilters)).toBe("/transactions");
    });

    it("serializes only non-default filters into query string", () => {
      const filters: TransactionFilters = {
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        categoryId: 5,
        accountId: 2,
        page: 2,
        size: 50,
        sort: "title,asc",
      };
      const query = buildTransactionQuery(filters);
      const params = new URLSearchParams(query);
      expect(params.get("startDate")).toBe("2026-01-01");
      expect(params.get("endDate")).toBe("2026-01-31");
      expect(params.get("categoryId")).toBe("5");
      expect(params.get("accountId")).toBe("2");
      expect(params.get("page")).toBe("2");
      expect(params.get("size")).toBe("50");
      expect(params.get("sort")).toBe("title,asc");
      expect(buildTransactionsHref(filters)).toBe(`/transactions?${query}`);
    });
  });

  describe("hasActiveTransactionFilters", () => {
    const base: TransactionFilters = {
      startDate: "",
      endDate: "",
      categoryId: null,
      accountId: null,
      page: 0,
      size: DEFAULT_TRANSACTION_PAGE_SIZE,
      sort: DEFAULT_TRANSACTION_SORT,
    };

    it("returns false for defaults and when only page changes", () => {
      expect(hasActiveTransactionFilters(base)).toBe(false);
      expect(hasActiveTransactionFilters({ ...base, page: 3 })).toBe(false);
    });

    it("returns true when any filter, size, or sort differs from default", () => {
      expect(
        hasActiveTransactionFilters({ ...base, startDate: "2026-01-01" }),
      ).toBe(true);
      expect(
        hasActiveTransactionFilters({ ...base, endDate: "2026-01-31" }),
      ).toBe(true);
      expect(hasActiveTransactionFilters({ ...base, categoryId: 1 })).toBe(
        true,
      );
      expect(hasActiveTransactionFilters({ ...base, accountId: 2 })).toBe(true);
      expect(hasActiveTransactionFilters({ ...base, size: 10 })).toBe(true);
      expect(
        hasActiveTransactionFilters({ ...base, sort: "amountInPln,desc" }),
      ).toBe(true);
    });
  });

  describe("normalizePage", () => {
    it("normalizes flat Spring PageImpl responses", () => {
      const normalized = normalizePage({
        content: [{ id: 1 }, { id: 2 }],
        number: 1,
        size: 10,
        totalElements: 25,
        totalPages: 3,
        first: false,
        last: false,
      });

      expect(normalized).toEqual({
        content: [{ id: 1 }, { id: 2 }],
        number: 1,
        size: 10,
        totalElements: 25,
        totalPages: 3,
        first: false,
        last: false,
      });
    });

    it("normalizes nested Spring page: {...} shape and computes first/last", () => {
      const firstPage = normalizePage({
        content: ["a", "b"],
        page: {
          number: 0,
          size: 2,
          totalElements: 5,
          totalPages: 3,
        },
      });
      expect(firstPage).toEqual({
        content: ["a", "b"],
        number: 0,
        size: 2,
        totalElements: 5,
        totalPages: 3,
        first: true,
        last: false,
      });

      const lastPage = normalizePage({
        content: ["e"],
        page: {
          number: 2,
          size: 2,
          totalElements: 5,
          totalPages: 3,
        },
      });
      expect(lastPage.first).toBe(false);
      expect(lastPage.last).toBe(true);
    });

    it("provides sensible defaults when pagination metadata is omitted", () => {
      const normalized = normalizePage({
        content: [1, 2, 3],
      });
      expect(normalized).toEqual({
        content: [1, 2, 3],
        number: 0,
        size: 20,
        totalElements: 3,
        totalPages: 1,
        first: true,
        last: true,
      });
    });
  });
});
