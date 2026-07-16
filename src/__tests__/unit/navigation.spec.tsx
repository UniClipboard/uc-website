import { fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";

import { Navigation } from "@/components/landing/Navigation";
import { localeMeta } from "@/i18n/locale-meta";
import { routing } from "@/i18n/routing";

const mockUseLocale = jest.fn();
jest.mock("next-intl", () => ({
  useLocale: () => mockUseLocale(),
  useTranslations: () => (key: string) => key,
}));

const replace = jest.fn();
jest.mock("../../i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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

  // The language switcher is a closed dropdown until its trigger is clicked; the
  // trigger's accessible name is the active locale's own name.
  const openLangMenu = (activeLocale: keyof typeof localeMeta = "en") => {
    fireEvent.click(
      screen.getByRole("button", { name: localeMeta[activeLocale].nativeName }),
    );
  };

  it("renders the language switcher trigger and the theme toggle", () => {
    render(<Navigation />);

    expect(
      screen.getByRole("button", { name: localeMeta.en.nativeName }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toBeInTheDocument();
  });

  it("reveals one option per routed locale once opened", () => {
    render(<Navigation />);
    openLangMenu();

    for (const locale of routing.locales) {
      expect(
        screen.getByRole("menuitemradio", {
          name: localeMeta[locale].nativeName,
        }),
      ).toBeInTheDocument();
    }
  });

  it("switches to Russian from the language menu", () => {
    render(<Navigation />);
    openLangMenu();

    fireEvent.click(
      screen.getByRole("menuitemradio", { name: localeMeta.ru.nativeName }),
    );
    expect(replace).toHaveBeenCalledWith("/", { locale: "ru" });
  });

  it("switches to Chinese from the language menu", () => {
    render(<Navigation />);
    openLangMenu();

    fireEvent.click(
      screen.getByRole("menuitemradio", { name: localeMeta.zh.nativeName }),
    );
    expect(replace).toHaveBeenCalledWith("/", { locale: "zh" });
  });

  it("does not call replace when choosing the active locale", () => {
    render(<Navigation />);
    openLangMenu();

    fireEvent.click(
      screen.getByRole("menuitemradio", { name: localeMeta.en.nativeName }),
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("hides the article sections in locales that have no article content", () => {
    mockUseLocale.mockReturnValue("ru");
    render(<Navigation />);

    expect(
      screen.queryByRole("link", { name: "blog" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "compare" }),
    ).not.toBeInTheDocument();
    // Non-article sections stay available.
    expect(
      screen.getAllByRole("link", { name: "changelog" }).length,
    ).toBeGreaterThan(0);
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

  it("links to the blog hub", () => {
    render(<Navigation />);

    expect(screen.getByRole("link", { name: "blog" })).toHaveAttribute(
      "href",
      "/blog",
    );
  });
});
