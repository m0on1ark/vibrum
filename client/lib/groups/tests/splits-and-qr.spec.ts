import { TextEncoder as NodeTextEncoder } from "node:util";

import { encodeQrMatrix } from "../qr-code";
import type { CreateExpenseInput } from "../schema";
import { buildSplits } from "../splits";
import {
  formatPolishIban,
  isInvitationActive,
  type GroupInvitation,
} from "../types";

function expectFinderPattern(
  matrix: boolean[][],
  top: number,
  left: number,
): void {
  for (let dr = 0; dr < 7; dr++) {
    for (let dc = 0; dc < 7; dc++) {
      const onOuterRing = dr === 0 || dr === 6 || dc === 0 || dc === 6;
      const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
      expect(matrix[top + dr][left + dc]).toBe(onOuterRing || inCenter);
    }
  }
}

describe("groups splits, types, and QR code encoder", () => {
  describe("buildSplits", () => {
    const members = [{ userId: 1 }, { userId: 2 }, { userId: 3 }];
    const baseExpense: CreateExpenseInput = {
      title: "Pizza",
      amount: 120,
      currency: "PLN",
      expenseDate: "2026-11-19",
      splitMode: "EQUAL",
    };

    it("returns an empty array for EQUAL mode regardless of entries", () => {
      expect(buildSplits(baseExpense, members, { 1: "abc" })).toEqual([]);
    });

    it("builds PERCENT splits and supports comma decimals while skipping zero/blank", () => {
      const result = buildSplits(
        { ...baseExpense, splitMode: "PERCENT" },
        members,
        { 1: "33,5", 2: "66.5", 3: "0" },
      );
      expect(result).toEqual([
        { userId: 1, percent: 33.5 },
        { userId: 2, percent: 66.5 },
      ]);
    });

    it("builds FIXED splits matching expense amount", () => {
      const result = buildSplits(
        { ...baseExpense, splitMode: "FIXED", amount: 120 },
        members,
        { 1: "50", 2: "70", 3: "" },
      );
      expect(result).toEqual([
        { userId: 1, amount: 50 },
        { userId: 2, amount: 70 },
      ]);
    });

    it("returns validation messages for invalid numbers, empty splits, or mismatched sums", () => {
      expect(
        buildSplits({ ...baseExpense, splitMode: "PERCENT" }, members, {
          1: "-5",
        }),
      ).toBe("Split values must be valid numbers.");

      expect(
        buildSplits({ ...baseExpense, splitMode: "FIXED" }, members, {
          1: "not-a-number",
        }),
      ).toBe("Split values must be valid numbers.");

      expect(
        buildSplits({ ...baseExpense, splitMode: "PERCENT" }, members, {
          1: "0",
          2: "  ",
        }),
      ).toBe("Fill in at least one split value.");

      expect(
        buildSplits({ ...baseExpense, splitMode: "PERCENT" }, members, {
          1: "40",
          2: "50",
        }),
      ).toBe("Percentages must sum to 100.");

      expect(
        buildSplits({ ...baseExpense, splitMode: "FIXED", amount: 120 }, members, {
          1: "50",
          2: "60",
        }),
      ).toBe("Amounts must sum to the expense total.");
    });
  });

  describe("formatPolishIban", () => {
    it("strips whitespace, uppercases, and groups into 4-character blocks", () => {
      expect(formatPolishIban("pl07109010140000000000000001")).toBe(
        "PL07 1090 1014 0000 0000 0000 0001",
      );
      expect(formatPolishIban(" 07 1090 1014 0000000000000001 ")).toBe(
        "0710 9010 1400 0000 0000 0000 01",
      );
    });
  });

  describe("isInvitationActive", () => {
    const baseInvitation: GroupInvitation = {
      id: 1,
      groupId: 10,
      groupName: "Trip",
      invitedByDisplayName: "Alice",
      status: "PENDING",
      createdAt: "2026-11-01T10:00:00Z",
      expiresAt: null,
    };

    it("returns true for PENDING invitations without expiration or expiring in the future", () => {
      const now = Date.parse("2026-11-19T12:00:00Z");
      expect(isInvitationActive(baseInvitation, now)).toBe(true);
      expect(
        isInvitationActive(
          { ...baseInvitation, expiresAt: "2026-11-20T12:00:00Z" },
          now,
        ),
      ).toBe(true);
    });

    it("returns false for expired or non-PENDING invitations", () => {
      const now = Date.parse("2026-11-19T12:00:00Z");
      expect(
        isInvitationActive(
          { ...baseInvitation, expiresAt: "2026-11-19T12:00:00Z" },
          now,
        ),
      ).toBe(false);
      expect(
        isInvitationActive(
          { ...baseInvitation, expiresAt: "2026-11-18T12:00:00Z" },
          now,
        ),
      ).toBe(false);
      expect(
        isInvitationActive({ ...baseInvitation, status: "ACCEPTED" }, now),
      ).toBe(false);
      expect(
        isInvitationActive({ ...baseInvitation, status: "DECLINED" }, now),
      ).toBe(false);
      expect(
        isInvitationActive({ ...baseInvitation, status: "EXPIRED" }, now),
      ).toBe(false);
    });
  });

  describe("encodeQrMatrix", () => {
    beforeAll(() => {
      if (typeof globalThis.TextEncoder === "undefined") {
        Object.defineProperty(globalThis, "TextEncoder", {
          value: NodeTextEncoder,
          configurable: true,
          writable: true,
        });
      }
    });

    it("produces a valid (4*v + 17) x (4*v + 17) matrix with finder patterns across versions", () => {
      const v1 = encodeQrMatrix("HELLO");
      expect(v1.length).toBe(21);
      v1.forEach((row) => expect(row.length).toBe(21));
      expectFinderPattern(v1, 0, 0);
      expectFinderPattern(v1, 0, 21 - 7);
      expectFinderPattern(v1, 21 - 7, 0);
      expect(v1[21 - 8][8]).toBe(true);

      const maxPayload = "A".repeat(192);
      const v8 = encodeQrMatrix(maxPayload);
      expect(v8.length).toBe(49);
      v8.forEach((row) => expect(row.length).toBe(49));
      expectFinderPattern(v8, 0, 0);
      expectFinderPattern(v8, 0, 49 - 7);
      expectFinderPattern(v8, 49 - 7, 0);
    });

    it("encodes a Polish ZBP QR payload into a Version 4 (33x33) matrix with valid finder patterns", () => {
      const zbpPayload =
        "|PL|07109010140000000000000001|005000|Alice|Vibrum: Pizza|||";
      const matrix = encodeQrMatrix(zbpPayload);

      // 67 bytes fits Version 4 (max 78 bytes at EC Level L) -> 4*4 + 17 = 33
      expect(matrix.length).toBe(33);
      matrix.forEach((row) => expect(row.length).toBe(33));

      expectFinderPattern(matrix, 0, 0);
      expectFinderPattern(matrix, 0, 33 - 7);
      expectFinderPattern(matrix, 33 - 7, 0);
      expect(matrix[33 - 8][8]).toBe(true);
    });

    it("throws when payload exceeds 192 UTF-8 bytes", () => {
      expect(() => encodeQrMatrix("A".repeat(193))).toThrow(
        "Payload exceeds QR code capacity (max 192 bytes)",
      );
      // 97 two-byte UTF-8 chars = 194 bytes
      expect(() => encodeQrMatrix("ą".repeat(97))).toThrow(
        "Payload exceeds QR code capacity (max 192 bytes)",
      );
    });
  });
});
