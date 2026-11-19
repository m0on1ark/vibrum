import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";

import { AppNav } from "../app-nav";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

const EXPECTED_ITEMS = [
  { label: "Pulpit", href: "/" },
  { label: "Transakcje", href: "/transactions" },
  { label: "Kategorie", href: "/categories" },
  { label: "Budżety", href: "/budgets" },
  { label: "Subskrypcje", href: "/subscriptions" },
  { label: "Grupy", href: "/groups" },
];

describe("AppNav", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all 6 navigation items", () => {
    mockUsePathname.mockReturnValue("/");

    render(<AppNav />);

    const nav = screen.getByRole("navigation", { name: "Nawigacja główna" });
    expect(nav).toBeInTheDocument();

    for (const item of EXPECTED_ITEMS) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", item.href);
    }
    expect(screen.getAllByRole("link")).toHaveLength(6);
  });

  it("sets aria-current='page' on Pulpit only when pathname is '/'", () => {
    mockUsePathname.mockReturnValue("/");

    render(<AppNav />);

    expect(screen.getByRole("link", { name: "Pulpit" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    for (const item of EXPECTED_ITEMS.filter((i) => i.href !== "/")) {
      expect(
        screen.getByRole("link", { name: item.label }),
      ).not.toHaveAttribute("aria-current");
    }
  });

  it("highlights Grupy on nested paths like '/groups/12'", () => {
    mockUsePathname.mockReturnValue("/groups/12");

    render(<AppNav />);

    expect(screen.getByRole("link", { name: "Grupy" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    for (const item of EXPECTED_ITEMS.filter((i) => i.href !== "/groups")) {
      expect(
        screen.getByRole("link", { name: item.label }),
      ).not.toHaveAttribute("aria-current");
    }
  });
});
