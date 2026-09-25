import { useLocale } from "next-intl";

import { Link } from "@/i18n/navigation";
import { getTryHref } from "@/lib/try-site";

export type HeroDownloadCtaLabels = {
  primary: string;
  secondaryHow: string;
  otherPlatforms: string;
  /** Secondary button to the in-browser demo; omitted when absent. */
  tryOnline?: string;
};

type Props = {
  labels: HeroDownloadCtaLabels;
  fullWidth?: boolean;
};

export function HeroDownloadCta({ labels, fullWidth = false }: Props) {
  const locale = useLocale();
  const buttonClass = fullWidth
    ? "bg-primary text-primary-foreground flex w-full items-center justify-center rounded-[10px] px-5 py-3.5 text-[15px] font-medium"
    : "bg-primary text-primary-foreground inline-flex items-center rounded-[8px] px-[18px] py-[10px] text-[13.5px] font-medium transition-transform hover:-translate-y-[1px]";

  return (
    <div
      className={
        fullWidth
          ? "flex w-full flex-col items-stretch gap-3.5"
          : "flex flex-col items-center gap-3.5"
      }
    >
      <div
        className={
          fullWidth
            ? "flex w-full flex-col items-stretch gap-2.5"
            : "flex flex-wrap items-center justify-center gap-2.5"
        }
      >
        <Link href="/download" className={buttonClass}>
          <span>{labels.primary}</span>
        </Link>
        {labels.tryOnline && (
          <Link
            href={getTryHref(locale)}
            prefetch={false}
            className="border-border text-foreground hover:bg-foreground/5 inline-flex items-center justify-center rounded-[8px] border px-[18px] py-[9px] text-[13.5px] font-medium transition-colors"
          >
            {labels.tryOnline}
          </Link>
        )}
      </div>

      <div
        className={
          fullWidth
            ? "text-muted-foreground flex items-center justify-center gap-2.5"
            : "text-muted-foreground flex items-center gap-2.5"
        }
        style={{ fontSize: fullWidth ? 13 : 12.5 }}
      >
        <Link
          href="/download"
          className="hover:text-foreground underline-offset-4 transition-colors hover:underline"
        >
          {labels.otherPlatforms}
        </Link>
        <span className="text-muted2" aria-hidden>
          ·
        </span>
        <Link
          href="/blog/whitepaper"
          className="hover:text-foreground underline-offset-4 transition-colors hover:underline"
        >
          {labels.secondaryHow}
        </Link>
      </div>
    </div>
  );
}
