import {
  DEFAULT_BASE_CURRENCY_CTX,
  convertFromPln,
  formatBaseEquivalent,
  formatOriginalPln,
  formatPrimaryFromPln,
  type BaseCurrencyContext,
} from "../base-currency";

const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

describe("base-currency helpers", () => {
  const plnCtx: BaseCurrencyContext = DEFAULT_BASE_CURRENCY_CTX;
  const eurCtx: BaseCurrencyContext = { baseCurrency: "EUR", rateToPln: 4.32 };

  describe("convertFromPln", () => {
    it("returns the original amount when baseCurrency is PLN", () => {
      expect(convertFromPln(100, plnCtx)).toBe(100);
      expect(convertFromPln(0, plnCtx)).toBe(0);
      expect(convertFromPln(-45.5, plnCtx)).toBe(-45.5);
    });

    it("converts PLN amount using rateToPln for EUR", () => {
      expect(convertFromPln(432, eurCtx)).toBeCloseTo(100, 6);
      expect(convertFromPln(108, eurCtx)).toBeCloseTo(25, 6);
      expect(convertFromPln(-43.2, eurCtx)).toBeCloseTo(-10, 6);
    });

    it("falls back to the original amount when rateToPln is zero or negative", () => {
      expect(convertFromPln(250, { baseCurrency: "EUR", rateToPln: 0 })).toBe(
        250,
      );
      expect(
        convertFromPln(250, { baseCurrency: "EUR", rateToPln: -4.32 }),
      ).toBe(250);
    });
  });

  describe("formatPrimaryFromPln", () => {
    it("formats PLN amounts directly when baseCurrency is PLN", () => {
      expect(normalizeSpaces(formatPrimaryFromPln(123.45, plnCtx))).toBe(
        "123,45 zł",
      );
    });

    it("converts and formats amounts in EUR when baseCurrency is EUR", () => {
      expect(normalizeSpaces(formatPrimaryFromPln(432, eurCtx))).toBe(
        "100,00 €",
      );
    });

    it("does not divide when rateToPln <= 0", () => {
      expect(
        normalizeSpaces(
          formatPrimaryFromPln(100, { baseCurrency: "EUR", rateToPln: 0 }),
        ),
      ).toBe("100,00 €");
    });
  });

  describe("formatOriginalPln", () => {
    it("returns null when baseCurrency is PLN", () => {
      expect(formatOriginalPln(100, plnCtx)).toBeNull();
    });

    it("returns null when rateToPln is zero or negative", () => {
      expect(
        formatOriginalPln(100, { baseCurrency: "EUR", rateToPln: 0 }),
      ).toBeNull();
      expect(
        formatOriginalPln(100, { baseCurrency: "EUR", rateToPln: -1 }),
      ).toBeNull();
    });

    it("formats original PLN amount with orig prefix for non-PLN base currency", () => {
      expect(normalizeSpaces(formatOriginalPln(432, eurCtx) ?? "")).toBe(
        "orig: 432,00 zł",
      );
    });
  });

  describe("formatBaseEquivalent", () => {
    it("returns null when baseCurrency matches sourceCurrency", () => {
      expect(formatBaseEquivalent(100, plnCtx)).toBeNull();
      expect(formatBaseEquivalent(100, eurCtx, "EUR")).toBeNull();
    });

    it("returns null when rateToPln is zero or negative", () => {
      expect(
        formatBaseEquivalent(100, { baseCurrency: "EUR", rateToPln: 0 }),
      ).toBeNull();
      expect(
        formatBaseEquivalent(100, { baseCurrency: "EUR", rateToPln: -2 }),
      ).toBeNull();
    });

    it("formats converted base equivalent when baseCurrency differs from sourceCurrency", () => {
      expect(normalizeSpaces(formatBaseEquivalent(432, eurCtx) ?? "")).toBe(
        "100,00 €",
      );
      expect(
        normalizeSpaces(formatBaseEquivalent(100, plnCtx, "EUR") ?? ""),
      ).toBe("100,00 zł");
    });
  });
});
