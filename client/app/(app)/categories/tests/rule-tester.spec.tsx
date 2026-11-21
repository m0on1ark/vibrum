import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { testRuleAction } from "../actions";
import { RuleTester } from "../rule-tester";

jest.mock("../actions", () => ({
  testRuleAction: jest.fn(),
}));

const mockTestRuleAction = testRuleAction as jest.MockedFunction<
  typeof testRuleAction
>;

describe("RuleTester", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits title and counterparty and displays matched category and rule details", async () => {
    mockTestRuleAction.mockResolvedValue({
      error: null,
      result: {
        matched: true,
        category: {
          id: 1,
          name: "Zakupy spożywcze",
          type: "EXPENSE",
          system: true,
        },
        rule: {
          id: 12,
          categoryId: 1,
          categoryName: "Zakupy spożywcze",
          matchType: "KEYWORD",
          target: "ANY",
          pattern: "BIEDRONKA",
          priority: 100,
          system: false,
        },
      },
    });

    render(<RuleTester />);

    fireEvent.change(screen.getByLabelText("Tytuł transakcji"), {
      target: { value: "Płatność kartą BIEDRONKA" },
    });
    fireEvent.change(screen.getByLabelText("Odbiorca / kontrahent"), {
      target: { value: "Jeronimo Martins Polska" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Testuj regułę" }));

    await waitFor(() => {
      expect(mockTestRuleAction).toHaveBeenCalledWith({
        title: "Płatność kartą BIEDRONKA",
        counterparty: "Jeronimo Martins Polska",
      });
    });

    expect(
      await screen.findByText("Dopasowana kategoria: Zakupy spożywcze"),
    ).toBeInTheDocument();
    expect(screen.getByText("Wydatek")).toBeInTheDocument();
    expect(screen.getByText("Systemowa")).toBeInTheDocument();
    expect(screen.getByText("BIEDRONKA")).toBeInTheDocument();
    expect(screen.getByText("Słowo kluczowe")).toBeInTheDocument();
    expect(screen.getByText("Tytuł lub odbiorca")).toBeInTheDocument();
    expect(screen.getByText("Priorytet: 100")).toBeInTheDocument();
    expect(screen.getByText("(własna)")).toBeInTheDocument();
  });

  it("displays no-match alert when testRuleAction resolves with matched: false", async () => {
    mockTestRuleAction.mockResolvedValue({
      error: null,
      result: {
        matched: false,
        category: null,
        rule: null,
      },
    });

    render(<RuleTester />);

    fireEvent.change(screen.getByLabelText("Tytuł transakcji"), {
      target: { value: "Nieznany przelew" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Testuj regułę" }));

    await waitFor(() => {
      expect(mockTestRuleAction).toHaveBeenCalledWith({
        title: "Nieznany przelew",
        counterparty: "",
      });
    });

    expect(await screen.findByText("Brak dopasowania")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Żadna aktywna reguła nie pasuje do podanego tytułu ani odbiorcy.",
      ),
    ).toBeInTheDocument();
  });
});
