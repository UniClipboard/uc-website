import { permanentRedirect } from "next/navigation";

import { localePathPrefix } from "@/i18n/locale-meta";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function WhitepaperRedirect({ params }: PageProps) {
  const { locale } = await params;
  const prefix = localePathPrefix(locale);
  permanentRedirect(`${prefix}/blog/whitepaper`);
}
