import { fireEvent, render, screen } from "@testing-library/react";

import { Navigation } from "@/components/landing/Navigation";

const mockUseLocale = jest.fn();
jest.mock("next-intl", () => ({
  useLocale: () => mockUseLocale(),
}));

const push = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({ push }),
}));

const setTheme = jest.fn();
jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme }),
}));

describe("Navigation", () => {
  beforeEach(() => {
    push.mockClear();
    setTheme.mockClear();
  });

  it("renders a unified language/theme control pill", () => {
    mockUseLocale.mockReturnValue("en");

    render(<Navigation />);

    expect(screen.getByTestId("nav-controls")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch language" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toBeInTheDocument();
  });

  it("switches locale while preserving current pathname", () => {
    mockUseLocale.mockReturnValue("en");

    render(<Navigation />);

    fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
    expect(push).toHaveBeenCalledWith("/zh");
  });

  it("toggles theme", () => {
    mockUseLocale.mockReturnValue("en");

    render(<Navigation />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
