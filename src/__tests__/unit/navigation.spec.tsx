import { fireEvent, render, screen } from "@testing-library/react";

import { Navigation } from "@/components/landing/Navigation";

const mockUseLocale = jest.fn();
jest.mock("next-intl", () => ({
  useLocale: () => mockUseLocale(),
  useTranslations: () => (key: string) => key,
}));

const replace = jest.fn();
jest.mock("../../i18n/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace }),
}));

const setTheme = jest.fn();
jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme }),
}));

describe("Navigation", () => {
  beforeEach(() => {
    replace.mockClear();
    setTheme.mockClear();
    mockUseLocale.mockReturnValue("en");
  });

  it("renders language tabs and the theme toggle", () => {
    render(<Navigation />);

    expect(screen.getByRole("button", { name: "ZH" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "EN" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toBeInTheDocument();
  });

  it("switches locale via the inline pathname-preserving router call", () => {
    render(<Navigation />);

    fireEvent.click(screen.getByRole("button", { name: "ZH" }));
    expect(replace).toHaveBeenCalledWith("/", { locale: "zh" });
  });

  it("does not call replace when clicking the active locale", () => {
    render(<Navigation />);

    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(replace).not.toHaveBeenCalled();
  });

  it("advances the theme one step in the system → light → dark cycle", () => {
    render(<Navigation />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("links to the GitHub repository", () => {
    render(<Navigation />);

    const githubLink = screen.getByRole("link", { name: "github" });
    expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/UniClipboard/UniClipboard",
    );
  });
});
