"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Drawer } from "@base-ui/react/drawer";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { localeMeta } from "@/i18n/locale-meta";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";
import { isArticleLocale } from "@/lib/article-content";

const items = routing.locales.map((code) => ({ code, ...localeMeta[code] }));
type LocaleItem = (typeof items)[number];

/** Current locale, browser-recommended locales, and a navigate-to-locale action. */
function useLocaleSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [recommended, setRecommended] = useState<string[]>([]);
  const current = items.find((item) => item.code === locale) ?? items[0];

  useEffect(() => {
    setRecommended(
      navigator.languages.flatMap((language) => {
        const tag = language.toLowerCase();
        const alias = /^zh-(tw|hk|mo|hant)(-|$)/.test(tag)
          ? "zh-TW"
          : tag.startsWith("zh")
            ? "zh"
            : tag.startsWith("pt")
              ? "pt-BR"
              : tag.split("-")[0];
        const match =
          items.find(
            (item) =>
              item.inLanguage.toLowerCase() === tag ||
              item.code.toLowerCase() === tag,
          ) ?? items.find((item) => item.code === alias);
        return match ? [match.code] : [];
      }),
    );
  }, []);

  const articleDetail = /^\/(blog|compare|use-cases)\/.+/.test(pathname);

  const switchTo = (item: LocaleItem | null) => {
    if (!item || item.code === locale) return;
    // Detail translations only exist in the content locales. Keep users in
    // the same section and show its availability notice instead of a 404.
    const target =
      articleDetail && !isArticleLocale(item.code)
        ? `/${pathname.split("/")[1]}`
        : pathname;
    router.replace(
      `${target}${window.location.search}${window.location.hash}`,
      {
        locale: item.code as Locale,
      },
    );
  };

  return { locale, current, recommended, articleDetail, switchTo };
}

export function LangSwitcher({ className }: { className?: string }) {
  const t = useTranslations("languagePicker");
  const { current, recommended, articleDetail, switchTo } = useLocaleSwitch();

  return (
    <Combobox.Root<LocaleItem>
      items={items}
      value={current}
      itemToStringLabel={(item) =>
        `${item.nativeName} ${item.englishName} ${item.code}`
      }
      onValueChange={switchTo}
    >
      <Combobox.Trigger
        data-testid="language-trigger"
        aria-label={t("label")}
        className={`border-border bg-foreground/5 text-muted-foreground hover:text-foreground data-[popup-open]:text-foreground inline-flex h-[30px] max-w-44 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors ${className ?? ""}`}
      >
        <Globe aria-hidden className="size-3.5 shrink-0" />
        <bdi className="truncate">{current.nativeName}</bdi>
        <ChevronDown
          aria-hidden
          className="size-3 shrink-0 transition-transform in-data-[popup-open]:rotate-180"
        />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="z-[100]"
        >
          <Combobox.Popup
            dir={current.dir}
            className="border-border bg-background text-foreground w-[min(18rem,calc(100vw-2rem))] rounded-xl border p-1.5 shadow-xl"
          >
            <Combobox.Input
              aria-label={t("search")}
              placeholder={t("search")}
              className="border-border bg-foreground/5 placeholder:text-muted2 focus:border-foreground/30 mb-1.5 h-9 w-full rounded-lg border px-3 text-base transition-colors outline-none sm:text-sm"
            />
            <Combobox.Empty className="text-muted-foreground px-3 text-sm empty:hidden [&:not(:empty)]:py-3">
              {t("empty")}
            </Combobox.Empty>
            <Combobox.List className="max-h-[min(24rem,55dvh)] overflow-y-auto overscroll-contain">
              {(item: LocaleItem) => (
                <Combobox.Item
                  key={item.code}
                  value={item}
                  data-locale={item.code}
                  className="data-[highlighted]:bg-bg2 text-muted-foreground data-[highlighted]:text-foreground data-[selected]:text-foreground flex h-9 cursor-pointer items-center gap-2 rounded-md px-2.5 text-start text-sm"
                >
                  <bdi lang={item.inLanguage} className="shrink-0">
                    {item.nativeName}
                  </bdi>
                  {recommended.includes(item.code) && (
                    <span className="border-border text-muted-foreground shrink-0 rounded-full border px-1.5 py-px text-[10px] leading-4">
                      {t("recommended")}
                    </span>
                  )}
                  <span
                    lang="en"
                    dir="ltr"
                    className="text-muted2 ms-auto min-w-0 truncate text-xs"
                  >
                    {item.englishName !== item.nativeName && item.englishName}
                  </span>
                  <span className="size-3.5 shrink-0">
                    <Combobox.ItemIndicator>
                      <Check aria-hidden className="text-foreground size-3.5" />
                    </Combobox.ItemIndicator>
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
            {articleDetail && (
              <p className="text-muted-foreground border-border mt-1.5 border-t px-2.5 pt-2 pb-1 text-xs">
                {t("articleAvailability")}
              </p>
            )}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/**
 * Mobile language picker: a compact header button that opens a bottom sheet
 * with one large row per language. No search field — with a dozen locales a
 * scrollable list is faster than summoning the on-screen keyboard.
 */
export function LangSheet() {
  const t = useTranslations("languagePicker");
  const { locale, current, recommended, articleDetail, switchTo } =
    useLocaleSwitch();
  const [open, setOpen] = useState(false);

  // Browser-recommended languages first, then the rest in routing order.
  const ordered = [
    ...items.filter((item) => recommended.includes(item.code)),
    ...items.filter((item) => !recommended.includes(item.code)),
  ];

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger
        data-testid="language-sheet-trigger"
        aria-label={`${t("label")}: ${current.nativeName}`}
        className="border-border text-foreground hover:bg-foreground/5 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors"
      >
        <Globe aria-hidden className="size-3.5 shrink-0" />
        <span dir="ltr">{current.label}</span>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-[100] bg-black opacity-[calc(0.5*(1-var(--drawer-swipe-progress,0)))] transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Viewport className="fixed inset-0 z-[100] flex items-end justify-center">
          <Drawer.Popup
            dir={current.dir}
            className="border-border bg-background text-foreground flex max-h-[85dvh] w-full [transform:translateY(var(--drawer-swipe-movement-y,0px))] flex-col rounded-t-2xl border-t pb-[max(12px,env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:[transform:translateY(100%)] data-[starting-style]:[transform:translateY(100%)] data-[swiping]:duration-0"
          >
            <div
              aria-hidden
              className="bg-foreground/20 mx-auto mt-2.5 mb-1 h-1 w-9 shrink-0 rounded-full"
            />
            <Drawer.Title className="text-muted-foreground px-5 pt-2 pb-2 text-xs font-medium tracking-wide">
              {t("label")}
            </Drawer.Title>
            <Drawer.Content className="min-h-0 overflow-y-auto overscroll-contain px-2">
              <ul>
                {ordered.map((item) => {
                  const selected = item.code === locale;
                  return (
                    <li key={item.code}>
                      <button
                        type="button"
                        data-locale={item.code}
                        aria-current={selected ? "true" : undefined}
                        onClick={() => {
                          setOpen(false);
                          switchTo(item);
                        }}
                        className={`active:bg-foreground/10 flex min-h-13 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-start transition-colors ${
                          selected ? "bg-foreground/5" : ""
                        }`}
                      >
                        <span className="flex min-w-0 flex-1 flex-col items-start">
                          <bdi
                            lang={item.inLanguage}
                            className="text-foreground text-[16px] leading-6"
                          >
                            {item.nativeName}
                          </bdi>
                          {item.englishName !== item.nativeName && (
                            <span
                              lang="en"
                              dir="ltr"
                              className="text-muted2 truncate text-start text-xs leading-4"
                            >
                              {item.englishName}
                            </span>
                          )}
                        </span>
                        {recommended.includes(item.code) && (
                          <span className="border-border text-muted-foreground shrink-0 rounded-full border px-1.5 py-px text-[10px] leading-4">
                            {t("recommended")}
                          </span>
                        )}
                        <span className="size-4 shrink-0">
                          {selected && (
                            <Check
                              aria-hidden
                              className="text-foreground size-4"
                            />
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {articleDetail && (
                <p className="text-muted-foreground border-border mx-3 mt-2 border-t pt-3 pb-1 text-xs">
                  {t("articleAvailability")}
                </p>
              )}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
