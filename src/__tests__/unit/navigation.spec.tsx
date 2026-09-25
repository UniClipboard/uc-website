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
    // Next's prefetch prop is not a DOM attribute.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    prefetch?: boolean;
  }) => (
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

  // The language switcher is a searchable combobox; its trigger is labelled by
  // the (mocked, key-echoing) `languagePicker.label` message.
  const openLangMenu = async () => {
    fireEvent.click(screen.getByTestId("language-trigger"));
    return screen.findByRole("listbox");
  };

  it("renders the language switcher trigger and the theme toggle", () => {
    render(<Navigation />);

    expect(screen.getByTestId("language-trigger")).toHaveTextContent(
      localeMeta.en.nativeName,
    );
    expect(
      screen.getByRole("button", { name: "themeLight" }),
    ).toBeInTheDocument();
  });

  it("reveals one option per routed locale once opened", async () => {
    render(<Navigation />);
    await openLangMenu();

    for (const locale of routing.locales) {
      expect(
        document.querySelector(`[data-locale="${locale}"]`),
      ).toHaveTextContent(localeMeta[locale].nativeName);
    }
  });

  it("switches to Russian from the language menu", async () => {
    render(<Navigation />);
    await openLangMenu();

    fireEvent.click(document.querySelector('[data-locale="ru"]')!);
    expect(replace).toHaveBeenCalledWith("/", { locale: "ru" });
  });

  it("switches to Chinese from the language menu", async () => {
    render(<Navigation />);
    await openLangMenu();

    fireEvent.click(document.querySelector('[data-locale="zh"]')!);
    expect(replace).toHaveBeenCalledWith("/", { locale: "zh" });
  });

  it("does not call replace when choosing the active locale", async () => {
    render(<Navigation />);
    await openLangMenu();

    fireEvent.click(document.querySelector('[data-locale="en"]')!);
    expect(replace).not.toHaveBeenCalled();
  });

  it("keeps the article sections in locales without article content", () => {
    // Their hubs explain which languages the articles are available in.
    mockUseLocale.mockReturnValue("ru");
    render(<Navigation />);

    expect(screen.getByRole("link", { name: "blog" })).toHaveAttribute(
      "href",
      "/blog",
    );
    expect(screen.getByRole("link", { name: "compare" })).toBeInTheDocument();
  });

  it("advances the theme one step in the system → light → dark cycle", () => {
    render(<Navigation />);

    fireEvent.click(screen.getByRole("button", { name: "themeLight" }));
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
