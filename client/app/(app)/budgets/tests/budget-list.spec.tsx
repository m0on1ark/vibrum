import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import type { BudgetSummary } from "@/lib/budgets/types";
import type { Category } from "@/lib/categories/types";
import type { BaseCurrencyContext } from "@/lib/currencies/base-currency";

import { deleteBudgetAction } from "../actions";
import { BudgetList } from "../budget-list";

const mockRefresh = jest.fn();
const mockPush = jest.fn();

jest.mock("../actions", () => ({
  deleteBudgetAction: jest.fn(),
  createBudgetAction: jest.fn(),
  updateBudgetAction: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: mockPush }),
}));

const mockDeleteBudget = deleteBudgetAction as jest.MockedFunction<
  typeof deleteBudgetAction
>;

const expenseCategories: Category[] = [
  { id: 1, name: "Jedzenie", type: "EXPENSE", system: true },
  { id: 2, name: "Transport", type: "EXPENSE", system: true },
  { id: 3, name: "Rozrywka", type: "EXPENSE", system: false },
];

const mockSummaries: BudgetSummary[] = [
  {
    budgetId: 11,
    categoryId: 1,
    categoryName: "Jedzenie",
    monthYear: "2026-04-01",
    limitAmount: 1000,
    currency: "PLN",
    spentAmount: 400,
    projectedAmount: 800,
    status: "OK",
  },
  {
    budgetId: 12,
    categoryId: 2,
    categoryName: "Transport",
    monthYear: "2026-04-01",
    limitAmount: 500,
    currency: "PLN",
    spentAmount: 400,
    projectedAmount: 550,
    status: "WARNING",
  },
  {
    budgetId: 13,
    categoryId: 3,
    categoryName: "Rozrywka",
    monthYear: "2026-04-01",
    limitAmount: 500,
    currency: "PLN",
    spentAmount: 600,
    projectedAmount: 700,
    status: "EXCEEDED",
  },
];

describe("BudgetList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty state with 'Brak budżetów' and 'Dodaj pierwszy budżet'", () => {
    render(
      <BudgetList
        summaries={[]}
        expenseCategories={expenseCategories}
        selectedMonth="2026-04"
        currentMonth="2026-04"
      />,
    );

    expect(screen.getByText("Brak budżetów")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dodaj pierwszy budżet" }),
    ).toBeInTheDocument();
  });

  it("renders overview totals, category cards, progress bars, Polish status badges, and orig PLN lines for EUR base currency", () => {
    const eurCtx: BaseCurrencyContext = {
      baseCurrency: "EUR",
      rateToPln: 4,
    };

    render(
      <BudgetList
        summaries={mockSummaries}
        expenseCategories={expenseCategories}
        selectedMonth="2026-04"
        currentMonth="2026-04"
        baseCurrencyCtx={eurCtx}
      />,
    );

    // BudgetOverview totals (2000 PLN -> 500 EUR, 1400 PLN -> 350 EUR, remaining 600 PLN -> 150 EUR)
    const overview = screen.getByRole("region", {
      name: "Podsumowanie miesiąca",
    });
    expect(overview).toBeInTheDocument();
    expect(within(overview).getByText("Łączny limit")).toBeInTheDocument();
    expect(within(overview).getByText("Wydano łącznie")).toBeInTheDocument();
    expect(
      within(overview).getByText("Pozostało do wydania"),
    ).toBeInTheDocument();
    expect(
      within(overview).getByText("3 kategorie z budżetem"),
    ).toBeInTheDocument();
    expect(within(overview).getByText(/500,00\s*€/)).toBeInTheDocument();
    expect(within(overview).getByText(/350,00\s*€/)).toBeInTheDocument();
    expect(within(overview).getByText(/150,00\s*€/)).toBeInTheDocument();
    expect(
      within(overview).getByText(/orig:\s*2[\s\u00a0]?000,00\s*zł/),
    ).toBeInTheDocument();
    expect(
      within(overview).getByText(/orig:\s*1[\s\u00a0]?400,00\s*zł/),
    ).toBeInTheDocument();
    expect(
      within(overview).getByText(/orig:\s*600,00\s*zł/),
    ).toBeInTheDocument();

    // Category cards
    expect(screen.getByText("Jedzenie")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("Rozrywka")).toBeInTheDocument();

    // Progress bars (1 in BudgetOverview + 3 in BudgetCard)
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars).toHaveLength(4);
    expect(
      screen.getByRole("progressbar", {
        name: "Łączne wykorzystanie budżetów",
      }),
    ).toHaveAttribute("aria-valuenow", "70");
    expect(
      screen.getByRole("progressbar", { name: "Wykorzystanie budżetu: Jedzenie" }),
    ).toHaveAttribute("aria-valuenow", "40");
    expect(
      screen.getByRole("progressbar", { name: "Wykorzystanie budżetu: Transport" }),
    ).toHaveAttribute("aria-valuenow", "80");
    expect(
      screen.getByRole("progressbar", { name: "Wykorzystanie budżetu: Rozrywka" }),
    ).toHaveAttribute("aria-valuenow", "120");

    // Polish status badges
    expect(screen.getByText("W normie")).toBeInTheDocument();
    expect(screen.getByText("Zagrożony")).toBeInTheDocument();
    expect(screen.getByText("Przekroczony")).toBeInTheDocument();

    // orig: PLN lines in overview + cards
    expect(screen.getByText(/orig:\s*2[\s\u00a0]?000,00\s*zł/)).toBeInTheDocument();
    expect(screen.getByText(/orig:\s*1[\s\u00a0]?400,00\s*zł/)).toBeInTheDocument();
    expect(screen.getAllByText(/orig:\s*600,00\s*zł/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/orig:\s*400,00\s*zł/).length).toBeGreaterThanOrEqual(2);
  });

  it("calls deleteBudgetAction after confirmation", async () => {
    mockDeleteBudget.mockResolvedValue({ error: null });
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <BudgetList
        summaries={mockSummaries}
        expenseCategories={expenseCategories}
        selectedMonth="2026-04"
        currentMonth="2026-04"
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Usuń" });
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDeleteBudget).toHaveBeenCalledWith(11);
    });
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    confirmSpy.mockRestore();
  });
});
