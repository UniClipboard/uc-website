import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function TrustSection() {
  const t = await getTranslations("landing.trust");

  return (
    <section id="trust" className="bg-gray-dark relative overflow-hidden py-32">
      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center gap-10 px-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <ShieldCheck className="size-10 text-white" />
        </div>
        <div className="max-w-2xl">
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            {t("title")}
          </h2>
          <p className="text-silver-accent text-xl leading-relaxed font-medium">
            {t("description")}
          </p>
        </div>
        <Link
          className="hover:bg-primary/90 bg-primary rounded-xl px-10 py-4 text-sm font-bold text-white shadow-xl transition-all"
          href="/whitepaper"
        >
          {t("cta")}
        </Link>
      </div>
      <div className="absolute top-0 right-0 h-full w-1/3 skew-x-12 bg-white/5"></div>
      <div className="absolute bottom-0 left-0 h-1/2 w-1/4 -rotate-12 bg-white/5"></div>
    </section>
  );
}
