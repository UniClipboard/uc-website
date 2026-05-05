import { permanentRedirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function WhitepaperRedirect({ params }: PageProps) {
  const { locale } = await params;
  const prefix = locale === "en" ? "" : `/${locale}`;
  permanentRedirect(`${prefix}/blog/whitepaper`);
}
