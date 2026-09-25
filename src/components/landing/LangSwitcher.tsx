"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { localeMeta } from "@/i18n/locale-meta";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";
import { isArticleLocale } from "@/lib/article-content";

const items = routing.locales.map((code) => ({ code, ...localeMeta[code] }));

export function LangSwitcher({
  placement = "bottom",
  className,
}: {
  placement?: "bottom" | "top";
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("languagePicker");
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
  return (
    <Combobox.Root<(typeof items)[number]>
      items={items}
      value={current}
      itemToStringLabel={(item) =>
        `${item.nativeName} ${item.englishName} ${item.code}`
      }
      onValueChange={(item) => {
        if (!item || item.code === locale) return;
        // Detail translations only exist in the content locales. Keep users in
        // the same section and show its availability notice instead of a 404.
        const target =
          articleDetail && !isArticleLocale(item.code)
            ? `/${pathname.split("/")[1]}`
            : pathname;
        router.replace(
          `${target}${window.location.search}${window.location.hash}`,
          { locale: item.code as Locale },
        );
      }}
    >
      <Combobox.Trigger
        data-testid="language-trigger"
        aria-label={t("label")}
        className={`border-border bg-foreground/5 text-muted-foreground hover:text-foreground data-[popup-open]:text-foreground inline-flex max-w-44 cursor-pointer items-center gap-1.5 rounded-full border transition-colors ${
          placement === "top"
            ? "min-h-11 px-4 text-sm"
            : "h-[30px] px-2.5 text-xs"
        } ${className ?? ""}`}
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
          side={placement}
          align={placement === "top" ? "start" : "end"}
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
              {(item: (typeof items)[number]) => (
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
