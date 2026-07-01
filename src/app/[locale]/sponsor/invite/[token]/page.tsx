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
  const wallHref = locale === "en" ? "/sponsor" : `/${locale}/sponsor`;

  const state = await getInviteState(token);

  return (
    <main className="uc-invite-bg relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-20 text-[#f4efe0]">
      <div className="relative w-full max-w-2xl">
        {state.valid ? (
          <SponsorClaimForm
            token={token}
            tier={state.tier}
            wallHref={wallHref}
          />
        ) : (
          <div className="relative overflow-hidden px-8 py-10 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 border border-[#f4efe0]/12"
            />
            <h1 className="text-xl font-bold tracking-tight text-[#f4efe0]">
              {t("invalidTitle")}
            </h1>
            <p className="relative mt-3 text-sm text-[#f4efe0]/55">
              {state.reason === "used"
                ? t("invalidUsed")
                : state.reason === "expired"
                  ? t("invalidExpired")
                  : t("invalidNotFound")}
            </p>
            <Link
              href={homeHref}
              className="relative mt-6 inline-block text-sm text-[#f4efe0]/50 underline transition-colors hover:text-[#f4efe0]"
            >
              {t("backHome")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
