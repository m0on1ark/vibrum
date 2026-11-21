import { createBudgetSchema, updateBudgetSchema } from "../schema";
import {
  buildBudgetsHref,
  parseBudgetMonth,
  shiftYearMonth,
  toMonthStartDate,
} from "../types";

describe("budgets types and schemas", () => {
  describe("parseBudgetMonth", () => {
    it("parses valid YYYY-MM and YYYY-MM-DD strings and array values", () => {
      expect(parseBudgetMonth("2026-05")).toBe("2026-05");
      expect(parseBudgetMonth(" 2026-11-19 ")).toBe("2026-11");
      expect(parseBudgetMonth(["2026-01", "2026-02"])).toBe("2026-01");
    });

    it.each([
      undefined,
      "",
      "2026",
      "2026-00",
      "2026-13",
      "1999-12",
      "2101-01",
      "2026-5",
      "invalid",
    ])("returns null for invalid month %j", (raw) => {
      expect(parseBudgetMonth(raw)).toBeNull();
    });
  });

  describe("shiftYearMonth", () => {
    it("shifts months forward and backward across year boundaries", () => {
      expect(shiftYearMonth("2026-05", 1)).toBe("2026-06");
      expect(shiftYearMonth("2026-12", 1)).toBe("2027-01");
      expect(shiftYearMonth("2026-01", -1)).toBe("2025-12");
      expect(shiftYearMonth("2026-03", -14)).toBe("2025-01");
    });
  });

  describe("toMonthStartDate", () => {
    it("appends -01 to YYYY-MM", () => {
      expect(toMonthStartDate("2026-11")).toBe("2026-11-01");
    });
  });

  describe("buildBudgetsHref", () => {
    it("returns base budgets path when yearMonth matches currentMonth", () => {
      expect(buildBudgetsHref("2026-11", "2026-11")).toBe("/budgets");
    });

    it("appends month query parameter when yearMonth differs from currentMonth", () => {
      expect(buildBudgetsHref("2026-10", "2026-11")).toBe(
        "/budgets?month=2026-10",
      );
    });
  });

  describe("createBudgetSchema", () => {
    const validPayload = {
      categoryId: 3,
      monthYear: "2026-11-01",
      limitAmount: 1500,
      currency: "PLN" as const,
    };

    it("accepts a valid budget payload", () => {
      expect(createBudgetSchema.safeParse(validPayload).success).toBe(true);
    });

    it("rejects non-positive or non-integer categoryId", () => {
      const zero = createBudgetSchema.safeParse({
        ...validPayload,
        categoryId: 0,
      });
      expect(zero.success).toBe(false);
      if (!zero.success) {
        expect(zero.error.issues[0]?.message).toBe(
          "Select an expense category",
        );
      }

      const floatId = createBudgetSchema.safeParse({
        ...validPayload,
        categoryId: 1.5,
      });
      expect(floatId.success).toBe(false);
    });

    it("rejects invalid monthYear format", () => {
      const result = createBudgetSchema.safeParse({
        ...validPayload,
        monthYear: "2026-11",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Select a valid month");
      }
    });

    it("rejects zero or negative limitAmount and non-PLN currency", () => {
      const badAmount = createBudgetSchema.safeParse({
        ...validPayload,
        limitAmount: 0,
      });
      expect(badAmount.success).toBe(false);
      if (!badAmount.success) {
        expect(badAmount.error.issues[0]?.message).toBe(
          "Limit must be greater than zero",
        );
      }

      const badCurrency = createBudgetSchema.safeParse({
        ...validPayload,
        currency: "EUR",
      });
      expect(badCurrency.success).toBe(false);
    });
  });

  describe("updateBudgetSchema", () => {
    it("accepts positive limitAmount and rejects zero or negative values", () => {
      expect(updateBudgetSchema.safeParse({ limitAmount: 500 }).success).toBe(
        true,
      );

      const zero = updateBudgetSchema.safeParse({ limitAmount: 0 });
      expect(zero.success).toBe(false);
      if (!zero.success) {
        expect(zero.error.issues[0]?.message).toBe(
          "Limit must be greater than zero",
        );
      }

      expect(updateBudgetSchema.safeParse({ limitAmount: -10 }).success).toBe(
        false,
      );
    });
  });
});
