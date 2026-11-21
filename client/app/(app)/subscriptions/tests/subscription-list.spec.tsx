import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { BaseCurrencyContext } from "@/lib/currencies/base-currency";
import type { Subscription, SubscriptionTotal } from "@/lib/subscriptions/types";

import {
  detectSubscriptionsAction,
  dismissSubscriptionAction,
} from "../actions";
import { SubscriptionList } from "../subscription-list";

const mockRefresh = jest.fn();

jest.mock("../actions", () => ({
  detectSubscriptionsAction: jest.fn(),
  dismissSubscriptionAction: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockDetectSubscriptions =
  detectSubscriptionsAction as jest.MockedFunction<
    typeof detectSubscriptionsAction
  >;
const mockDismissSubscription =
  dismissSubscriptionAction as jest.MockedFunction<
    typeof dismissSubscriptionAction
  >;

const mockSubscriptions: Subscription[] = [
  {
    id: 101,
    merchant: "Netflix",
    amount: 40,
    currency: "PLN",
    billingPeriod: "MONTHLY",
    occurrences: 3,
    lastPaymentDate: "2026-03-15",
    nextPaymentDate: "2026-04-15",
    categoryId: 5,
    categoryName: "Rozrywka",
  },
  {
    id: 102,
    merchant: "iCloud+",
    amount: 10,
    currency: "EUR",
    billingPeriod: "MONTHLY",
    occurrences: 1,
    lastPaymentDate: "2026-03-20",
    nextPaymentDate: "2026-04-20",
    categoryId: null,
    categoryName: null,
  },
];

const mockTotals: SubscriptionTotal[] = [
  {
    currency: "PLN",
    count: 1,
    monthlyCost: 40,
    yearlyCost: 480,
  },
];

describe("SubscriptionList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty state explanation and triggers detectSubscriptionsAction on click", async () => {
    mockDetectSubscriptions.mockResolvedValue({ error: null });

    render(<SubscriptionList subscriptions={[]} totals={[]} />);

    expect(screen.getByText("Brak wykrytych subskrypcji")).toBeInTheDocument();
    expect(
      screen.getByText(/Subskrypcje są wykrywane na podstawie/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Przejdź do kont i importu" }),
    ).toBeInTheDocument();

    const detectButton = screen.getByRole("button", {
      name: "Wykryj subskrypcje",
    });
    fireEvent.click(detectButton);

    await waitFor(() => {
      expect(mockDetectSubscriptions).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("renders summary cards, table rows, converted EUR + orig PLN, and dismisses subscription", async () => {
    mockDismissSubscription.mockResolvedValue({ error: null });

    const eurCtx: BaseCurrencyContext = {
      baseCurrency: "EUR",
      rateToPln: 4,
    };

    render(
      <SubscriptionList
        subscriptions={mockSubscriptions}
        totals={mockTotals}
        baseCurrencyCtx={eurCtx}
      />,
    );

    const summarySection = screen.getByRole("region", {
      name: "Podsumowanie kosztów subskrypcji",
    });
    expect(summarySection).toBeInTheDocument();
    expect(screen.getByText("1 aktywna subskrypcja")).toBeInTheDocument();
    expect(screen.getByText("Koszt miesięczny")).toBeInTheDocument();
    expect(screen.getByText("Koszt roczny")).toBeInTheDocument();

    // Converted EUR summary + original PLN lines (40 PLN / 4 = 10 EUR; 480 PLN / 4 = 120 EUR)
    expect(screen.getByText(/orig:\s*480,00\s*zł/)).toBeInTheDocument();
    expect(screen.getByText(/120,00\s*€/)).toBeInTheDocument();

    // Table rows
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText("3 płatności")).toBeInTheDocument();
    expect(screen.getByText("Rozrywka")).toBeInTheDocument();

    expect(screen.getByText("iCloud+")).toBeInTheDocument();
    expect(screen.getByText("1 płatność")).toBeInTheDocument();
    expect(screen.getByText("Bez kategorii")).toBeInTheDocument();

    // 40 PLN converted to EUR in table row + summary monthly card
    expect(screen.getAllByText(/orig:\s*40,00\s*zł/)).toHaveLength(2);
    expect(screen.getAllByText(/10,00\s*€/).length).toBeGreaterThanOrEqual(2);

    const dismissButtons = screen.getAllByRole("button", {
      name: "To nie subskrypcja",
    });
    expect(dismissButtons).toHaveLength(2);

    fireEvent.click(dismissButtons[0]);

    await waitFor(() => {
      expect(mockDismissSubscription).toHaveBeenCalledWith(101);
    });
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
