import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("landing.footer");

  const links = [
    { key: "twitter", href: "https://x.com/UniClipboard" },
    { key: "github", href: "https://github.com/UniClipboard/UniClipboard" },
  ];

  return (
    <footer className="border-border bg-background border-t py-16">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-10 px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
          <span className="text-foreground text-xl font-bold tracking-tight">
            UniClipboard
          </span>
        </div>
        <div className="text-muted-foreground flex flex-wrap justify-center gap-8 text-xs font-bold tracking-widest uppercase">
          {links.map((link) => (
            <a
              key={link.key}
              className="hover:text-foreground transition-colors"
              href={link.href}
            >
              {t(link.key)}
            </a>
          ))}
        </div>
        <div className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
          {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
