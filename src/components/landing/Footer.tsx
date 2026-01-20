import { getTranslations } from "next-intl/server";

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations("landing.footer");

  const links = [
    { key: "privacy", href: "#" },
    { key: "terms", href: "#" },
    { key: "twitter", href: "#" },
    { key: "github", href: "#" },
  ];

  return (
    <footer className="border-t border-gray-mid dark:border-slate-700 py-16 bg-white dark:bg-slate-900">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-gray-light dark:bg-slate-800 text-gray-dark dark:text-slate-100 flex items-center justify-center rounded-lg">
            <svg className="size-4" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-dark dark:text-slate-100">UniClipboard</span>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {links.map((link) => (
            <a key={link.key} className="hover:text-gray-dark dark:hover:text-slate-100 transition-colors" href={link.href}>
              {t(link.key)}
            </a>
          ))}
        </div>
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
