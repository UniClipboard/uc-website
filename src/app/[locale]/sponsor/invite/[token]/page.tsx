import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SponsorClaimForm } from "@/components/sponsor/SponsorClaimForm";
import { getInviteState } from "@/lib/sponsor-invites";

// Validity is per-request and these links must never be cached or indexed.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ locale: string; token: string }> };

export default async function SponsorInvitePage({ params }: Params) {
  const { locale, token } = await params;
  const t = await getTranslations({ locale, namespace: "sponsorClaim" });
  const homeHref = locale === "en" ? "/" : `/${locale}`;

  const state = await getInviteState(token);

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {state.valid ? (
          <SponsorClaimForm token={token} />
        ) : (
          <div className="border-border bg-bg2/40 rounded-2xl border p-8 text-center">
            <h1 className="text-xl font-semibold">{t("invalidTitle")}</h1>
            <p className="text-muted-foreground mt-3 text-sm">
              {state.reason === "used"
                ? t("invalidUsed")
                : state.reason === "expired"
                  ? t("invalidExpired")
                  : t("invalidNotFound")}
            </p>
            <Link
              href={homeHref}
              className="text-muted-foreground hover:text-foreground mt-6 inline-block text-sm underline"
            >
              {t("backHome")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
