import { notFound } from "next/navigation";

import { formatAmount, formatDate, formatMoney } from "../format";
import { parseId } from "../parse-id";
import { pluralPl } from "../plural";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

describe("shared format, plural, and parseId helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("formatMoney", () => {
    it("formats valid ISO currency codes in pl-PL locale", () => {
      expect(normalizeSpaces(formatMoney(12345.5, "PLN"))).toBe(
        "12 345,50 zł",
      );
      expect(normalizeSpaces(formatMoney(99.9, "EUR"))).toBe("99,90 €");
      expect(normalizeSpaces(formatMoney(-15.25, "PLN"))).toBe("-15,25 zł");
    });

    it("falls back to fixed 2-decimal string for invalid currency code", () => {
      expect(formatMoney(42.5, "INVALID_CUR")).toBe("42.50 INVALID_CUR");
    });
  });

  describe("formatAmount", () => {
    it("formats numbers with two fraction digits in pl-PL locale", () => {
      expect(normalizeSpaces(formatAmount(0))).toBe("0,00");
      expect(normalizeSpaces(formatAmount(12345.5))).toBe("12 345,50");
      expect(normalizeSpaces(formatAmount(10.129))).toBe("10,13");
    });
  });

  describe("formatDate", () => {
    it("formats valid date strings using pl-PL medium date style", () => {
      const expected = new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "medium",
      }).format(new Date("2026-05-14T00:00:00Z"));
      expect(formatDate("2026-05-14T00:00:00Z")).toBe(expected);
    });

    it("returns the original string for invalid dates", () => {
      expect(formatDate("not-a-date")).toBe("not-a-date");
      expect(formatDate("")).toBe("");
    });
  });

  describe("pluralPl", () => {
    it.each([
      [0, "transakcji"],
      [1, "transakcja"],
      [2, "transakcje"],
      [4, "transakcje"],
      [5, "transakcji"],
      [12, "transakcji"],
      [13, "transakcji"],
      [14, "transakcji"],
      [22, "transakcje"],
      [25, "transakcji"],
    ])("returns Polish plural form for count=%i", (count, expected) => {
      expect(pluralPl(count, "transakcja", "transakcje", "transakcji")).toBe(
        expected,
      );
    });
  });

  describe("parseId", () => {
    it("returns positive integers for valid id strings", () => {
      expect(parseId("1")).toBe(1);
      expect(parseId("42")).toBe(42);
    });

    it.each(["0", "-1", "1.5", "abc", "", "   "])(
      "calls notFound() for invalid id %j",
      (raw) => {
        expect(() => parseId(raw)).toThrow("NEXT_NOT_FOUND");
        expect(notFound).toHaveBeenCalledTimes(1);
        jest.clearAllMocks();
      },
    );
  });
});
