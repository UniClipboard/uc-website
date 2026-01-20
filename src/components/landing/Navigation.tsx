import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getFormUrl } from "@/lib/form-config";

export async function Navigation({ locale }: { locale: string }) {
  const t = await getTranslations("landing.navigation");
  const formUrl = getFormUrl(locale as "zh" | "en");

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[1100px]">
      <nav className="glass-panel rounded-2xl px-8 py-4 flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="size-9 bg-gray-dark text-white flex items-center justify-center rounded-lg shadow-sm">
            <svg className="size-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-gray-dark dark:text-slate-100">UniClipboard</h2>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a className="text-xs font-bold text-slate-500 hover:text-gray-dark dark:hover:text-slate-100 transition-colors uppercase tracking-widest" href="#features">{t("features")}</a>
          <a className="text-xs font-bold text-slate-500 hover:text-gray-dark dark:hover:text-slate-100 transition-colors uppercase tracking-widest" href="#trust">{t("trust")}</a>
          <a className="text-xs font-bold text-slate-500 hover:text-gray-dark dark:hover:text-slate-100 transition-colors uppercase tracking-widest" href="#roadmap">{t("roadmap")}</a>
        </div>
        <a href={formUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-dark text-white text-xs font-bold px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-all uppercase tracking-wider">
          {t("cta")}
        </a>
      </nav>
    </header>
  );
}
