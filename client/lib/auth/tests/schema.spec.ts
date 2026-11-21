import { changePasswordSchema, updateProfileSchema } from "../schema";

describe("auth schemas", () => {
  describe("updateProfileSchema", () => {
    const validBase = {
      displayName: "Jan Kowalski",
      baseCurrency: "pln",
      iban: "",
    };

    it("accepts empty IBAN and normalizes 3-letter baseCurrency", () => {
      const parsed = updateProfileSchema.parse(validBase);
      expect(parsed.baseCurrency).toBe("PLN");
      expect(parsed.iban).toBe("");
    });

    it("accepts valid Polish IBANs with or without PL prefix and formatting", () => {
      expect(
        updateProfileSchema.safeParse({
          ...validBase,
          baseCurrency: " eur ",
          iban: "PL07 1090 1014 0000 0000 0000 0001",
        }).success,
      ).toBe(true);

      expect(
        updateProfileSchema.safeParse({
          ...validBase,
          iban: "07-1090-1014-0000-0000-0000-0001",
        }).success,
      ).toBe(true);
    });

    it("rejects invalid Polish IBANs", () => {
      const tooShort = updateProfileSchema.safeParse({
        ...validBase,
        iban: "PL1234",
      });
      expect(tooShort.success).toBe(false);
      if (!tooShort.success) {
        expect(tooShort.error.issues[0]?.message).toBe(
          "Enter a valid Polish IBAN (26 digits, optional PL prefix)",
        );
      }

      const wrongCountry = updateProfileSchema.safeParse({
        ...validBase,
        iban: "DE07109010140000000000000001",
      });
      expect(wrongCountry.success).toBe(false);

      const overMaxLen = updateProfileSchema.safeParse({
        ...validBase,
        iban: "0".repeat(51),
      });
      expect(overMaxLen.success).toBe(false);
      if (!overMaxLen.success) {
        expect(overMaxLen.error.issues[0]?.message).toBe(
          "IBAN must be at most 50 characters",
        );
      }
    });

    it("rejects invalid baseCurrency codes and blank displayName", () => {
      const badCurrency = updateProfileSchema.safeParse({
        ...validBase,
        baseCurrency: "EURO",
      });
      expect(badCurrency.success).toBe(false);
      if (!badCurrency.success) {
        expect(badCurrency.error.issues[0]?.message).toBe(
          "Select a valid 3-letter currency code",
        );
      }

      const badName = updateProfileSchema.safeParse({
        ...validBase,
        displayName: "   ",
      });
      expect(badName.success).toBe(false);
      if (!badName.success) {
        expect(badName.error.issues[0]?.message).toBe("Enter your name");
      }
    });
  });

  describe("changePasswordSchema", () => {
    it("accepts matching newPassword and confirmPassword", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "old-password",
        newPassword: "new-password-123",
        confirmPassword: "new-password-123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mismatched confirmPassword on the confirmPassword path", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "old-password",
        newPassword: "new-password-123",
        confirmPassword: "different-password",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Passwords do not match");
        expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
      }
    });

    it("rejects empty currentPassword and short newPassword", () => {
      const noCurrent = changePasswordSchema.safeParse({
        currentPassword: "",
        newPassword: "new-password-123",
        confirmPassword: "new-password-123",
      });
      expect(noCurrent.success).toBe(false);

      const shortNew = changePasswordSchema.safeParse({
        currentPassword: "old-password",
        newPassword: "short",
        confirmPassword: "short",
      });
      expect(shortNew.success).toBe(false);
    });
  });
});
