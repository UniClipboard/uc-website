import { getTranslations } from "next-intl/server";

export async function Footer({ locale: _locale }: { locale: string }) {
  const t = await getTranslations("landing.footer");

  const links = [
    { key: "privacy", href: "#" },
    { key: "terms", href: "#" },
    { key: "twitter", href: "#" },
    { key: "github", href: "#" },
  ];

  return (
    <footer className="border-gray-mid border-t bg-white py-16 dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-10 px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="bg-gray-light text-gray-dark flex size-8 items-center justify-center rounded-lg dark:bg-slate-800 dark:text-slate-100">
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
          <span className="text-gray-dark text-xl font-bold tracking-tight dark:text-slate-100">
            UniClipboard
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
          {links.map((link) => (
            <a
              key={link.key}
              className="hover:text-gray-dark transition-colors dark:hover:text-slate-100"
              href={link.href}
            >
              {t(link.key)}
            </a>
          ))}
        </div>
        <div className="text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
          {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
