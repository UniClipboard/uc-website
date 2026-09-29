"use client";

import { Drawer } from "@base-ui/react/drawer";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { items, useLocaleSwitch } from "./LangSwitcher";

/**
 * Mobile language picker: a bottom sheet with one large row per language.
 * No search field — with a dozen locales a scrollable list is faster than
 * summoning the on-screen keyboard. Loaded lazily by `LangSheetButton`.
 */
export default function LangSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("languagePicker");
  const { locale, current, recommended, articleDetail, switchTo } =
    useLocaleSwitch();
  // This component mounts already requested-open (it is lazy-loaded on the
  // first tap). Render one closed frame first so the enter transition runs.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Browser-recommended languages first, then the rest in routing order.
  const ordered = [
    ...items.filter((item) => recommended.includes(item.code)),
    ...items.filter((item) => !recommended.includes(item.code)),
  ];

  return (
    <Drawer.Root open={open && mounted} onOpenChange={onOpenChange}>
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
                          onOpenChange(false);
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
