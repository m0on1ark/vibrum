import { categorySchema, ruleSchema, testRuleSchema } from "../schema";

describe("categories schemas", () => {
  describe("categorySchema", () => {
    it("accepts valid category input and trims name", () => {
      expect(
        categorySchema.parse({ name: "  Groceries  ", type: "EXPENSE" }),
      ).toEqual({
        name: "Groceries",
        type: "EXPENSE",
      });
      expect(
        categorySchema.safeParse({ name: "Salary", type: "INCOME" }).success,
      ).toBe(true);
    });

    it("rejects blank name, over-100-char name, and invalid type", () => {
      const blank = categorySchema.safeParse({ name: "   ", type: "EXPENSE" });
      expect(blank.success).toBe(false);
      if (!blank.success) {
        expect(blank.error.issues[0]?.message).toBe("Enter a category name");
      }

      expect(
        categorySchema.safeParse({ name: "a".repeat(101), type: "EXPENSE" })
          .success,
      ).toBe(false);
      expect(
        categorySchema.safeParse({ name: "Food", type: "TRANSFER" }).success,
      ).toBe(false);
    });
  });

  describe("ruleSchema", () => {
    const validRule = {
      categoryId: 2,
      matchType: "KEYWORD" as const,
      target: "ANY" as const,
      pattern: "biedronka",
      priority: 10,
    };

    it("accepts valid rule input", () => {
      expect(ruleSchema.safeParse(validRule).success).toBe(true);
      expect(
        ruleSchema.safeParse({
          ...validRule,
          matchType: "REGEX",
          target: "COUNTERPARTY",
          priority: -5,
        }).success,
      ).toBe(true);
    });

    it("rejects invalid categoryId, blank pattern, and non-integer priority", () => {
      expect(
        ruleSchema.safeParse({ ...validRule, categoryId: 0 }).success,
      ).toBe(false);
      expect(
        ruleSchema.safeParse({ ...validRule, pattern: "   " }).success,
      ).toBe(false);
      expect(
        ruleSchema.safeParse({ ...validRule, priority: 1.5 }).success,
      ).toBe(false);
    });
  });

  describe("testRuleSchema", () => {
    it("accepts input when title or counterparty is non-empty", () => {
      expect(
        testRuleSchema.safeParse({ title: "Coffee", counterparty: "" }).success,
      ).toBe(true);
      expect(
        testRuleSchema.safeParse({ title: "", counterparty: "Cafe" }).success,
      ).toBe(true);
      expect(
        testRuleSchema.safeParse({ title: "Coffee", counterparty: "Cafe" })
          .success,
      ).toBe(true);
    });

    it("rejects when both title and counterparty are blank", () => {
      const result = testRuleSchema.safeParse({
        title: "   ",
        counterparty: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Enter a title or counterparty",
        );
        expect(result.error.issues[0]?.path).toEqual(["title"]);
      }
    });

    it("rejects title or counterparty exceeding 500 characters", () => {
      expect(
        testRuleSchema.safeParse({
          title: "a".repeat(501),
          counterparty: "",
        }).success,
      ).toBe(false);
      expect(
        testRuleSchema.safeParse({
          title: "",
          counterparty: "b".repeat(501),
        }).success,
      ).toBe(false);
    });
  });
});
