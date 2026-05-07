import { getTranslations } from "next-intl/server";
import { ImageResponse } from "takumi-js/response";

import { OG_CONTENT_TYPE, OG_SIZE, OgFrame } from "@/components/og/OgFrame";
import { loadOgFonts } from "@/lib/og/fonts";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Download UniClipboard";

type Params = { params: Promise<{ locale: string }> };

export default async function Image({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "og.download" });
  const eyebrow = t("eyebrow");
  const title = t("title");
  const subtitle = t("subtitle");

  const fonts = await loadOgFonts(locale, `${eyebrow}${title}${subtitle}`);

  return new ImageResponse(
    <OgFrame
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      locale={locale}
      footer="uniclipboard.app/download"
    />,
    { ...OG_SIZE, fonts },
  );
}
