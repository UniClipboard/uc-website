import { Link } from "@/i18n/navigation";

export type HeroDownloadCtaLabels = {
  primary: string;
  secondaryHow: string;
  otherPlatforms: string;
};

type Props = {
  labels: HeroDownloadCtaLabels;
  fullWidth?: boolean;
};

export function HeroDownloadCta({ labels, fullWidth = false }: Props) {
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
      <Link href="/download" className={buttonClass}>
        <span>{labels.primary}</span>
      </Link>

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
