import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";

const shimmer = "animate-pulse bg-foreground/10 rounded";

export default function DownloadLoading() {
  return (
    <>
      <Navigation />
      <main aria-busy="true" aria-live="polite">
        {/* Hero */}
        <section className="border-border bg-background border-b pt-28 pb-14 md:pt-36 md:pb-20">
          <div className="landing-shell">
            <div className={`mb-7 h-3 w-40 ${shimmer}`} />
            <div className={`mb-3.5 h-3 w-28 ${shimmer}`} />
            <div className="space-y-3">
              <div className={`h-10 w-full max-w-[560px] ${shimmer}`} />
              <div className={`h-10 w-3/4 max-w-[420px] ${shimmer}`} />
            </div>
            <div className={`mt-6 h-4 w-full max-w-[640px] ${shimmer}`} />
            <div className={`mt-2 h-4 w-3/5 max-w-[420px] ${shimmer}`} />

            <div className="border-border bg-bg2/50 mt-9 flex flex-col gap-5 rounded-[14px] border p-6 md:flex-row md:items-center md:justify-between md:p-7">
              <div className="flex flex-1 flex-col gap-2.5">
                <div className={`h-3 w-24 ${shimmer}`} />
                <div className="mt-1 flex flex-wrap items-baseline gap-3">
                  <div className={`h-8 w-28 ${shimmer}`} />
                  <div className={`h-3 w-16 ${shimmer}`} />
                  <div className={`h-3 w-40 ${shimmer}`} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <div className={`h-6 w-28 ${shimmer}`} />
                  <div className={`h-6 w-32 ${shimmer}`} />
                  <div className={`h-6 w-32 ${shimmer}`} />
                  <div className={`h-6 w-32 ${shimmer}`} />
                </div>
              </div>
              <div className={`h-10 w-44 ${shimmer}`} />
            </div>
          </div>
        </section>

        {/* Direct downloads */}
        <section className="border-border bg-bg2 border-b py-[72px] md:py-[100px]">
          <div className="landing-shell">
            <div className="grid items-start gap-10 md:grid-cols-[1fr_1.1fr] md:gap-16">
              <div>
                <div className={`mb-3.5 h-3 w-32 ${shimmer}`} />
                <div className={`mb-4 h-8 w-3/4 max-w-[380px] ${shimmer}`} />
                <div className={`h-4 w-full max-w-[460px] ${shimmer}`} />
                <div className={`mt-2 h-4 w-4/5 max-w-[420px] ${shimmer}`} />
              </div>
              <div className="border-border bg-card rounded-[18px] border p-[22px]">
                <div className="bg-bg2 mb-[18px] flex gap-1 rounded-[12px] p-1">
                  <div className={`h-9 flex-1 ${shimmer}`} />
                  <div className={`h-9 flex-1 ${shimmer}`} />
                  <div className={`h-9 flex-1 ${shimmer}`} />
                </div>
                <div className="space-y-2.5">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="border-border flex items-center gap-3.5 rounded-[12px] border px-4 py-3.5"
                    >
                      <div className={`size-9 shrink-0 ${shimmer}`} />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className={`h-4 w-32 ${shimmer}`} />
                        <div className={`h-3 w-44 ${shimmer}`} />
                      </div>
                      <div className={`size-7 shrink-0 ${shimmer}`} />
                    </div>
                  ))}
                </div>
                <div
                  className="mt-[18px] flex items-center justify-between pt-3.5"
                  style={{ borderTop: "1px solid var(--hair2)" }}
                >
                  <div className={`h-3 w-24 ${shimmer}`} />
                  <div className={`h-3 w-28 ${shimmer}`} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Package managers */}
        <section className="border-border bg-background border-b py-[72px] md:py-[100px]">
          <div className="landing-shell">
            <div className="mb-10 max-w-[680px]">
              <div className={`mb-3.5 h-3 w-32 ${shimmer}`} />
              <div className={`mb-4 h-8 w-3/4 max-w-[420px] ${shimmer}`} />
              <div className={`h-4 w-full max-w-[560px] ${shimmer}`} />
              <div className={`mt-2 h-4 w-2/3 max-w-[400px] ${shimmer}`} />
            </div>
            <div className="grid gap-5 md:grid-cols-2 md:gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="border-border bg-card flex h-full flex-col gap-4 rounded-[16px] border p-5 md:p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-10 shrink-0 ${shimmer}`} />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className={`h-4 w-36 ${shimmer}`} />
                      <div className={`h-3 w-24 ${shimmer}`} />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className={`h-3.5 w-full ${shimmer}`} />
                    <div className={`h-3.5 w-[88%] ${shimmer}`} />
                    <div className={`h-3.5 w-3/5 ${shimmer}`} />
                  </div>
                  <div className={`h-10 w-full ${shimmer}`} />
                  <div className="flex items-center justify-between pt-1">
                    <div className={`h-3 w-24 ${shimmer}`} />
                    <div className={`h-3 w-20 ${shimmer}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* System requirements */}
        <section className="border-border bg-bg2 border-b py-[72px] md:py-[100px]">
          <div className="landing-shell">
            <div className="mb-10 max-w-[680px]">
              <div className={`mb-3.5 h-3 w-36 ${shimmer}`} />
              <div className={`mb-4 h-8 w-3/4 max-w-[420px] ${shimmer}`} />
              <div className={`h-4 w-full max-w-[520px] ${shimmer}`} />
            </div>
            <div className="border-border bg-card divide-border divide-y overflow-hidden rounded-[14px] border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[140px_1fr_1fr_140px_110px] md:items-center md:gap-5 md:py-5"
                >
                  <div className={`h-4 w-24 ${shimmer}`} />
                  <div className={`h-4 w-full max-w-[260px] ${shimmer}`} />
                  <div className={`h-4 w-full max-w-[220px] ${shimmer}`} />
                  <div className={`h-4 w-20 ${shimmer}`} />
                  <div className={`h-4 w-16 ${shimmer}`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Verify */}
        <section className="border-border bg-background border-b py-[72px] md:py-[100px]">
          <div className="landing-shell">
            <div className="mb-10 max-w-[680px]">
              <div className={`mb-3.5 h-3 w-32 ${shimmer}`} />
              <div className={`mb-4 h-8 w-3/4 max-w-[400px] ${shimmer}`} />
              <div className={`h-4 w-full max-w-[560px] ${shimmer}`} />
            </div>
            <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="border-border bg-card flex h-full flex-col rounded-[14px] border p-5 md:p-6"
                >
                  <div className={`h-3 w-20 ${shimmer}`} />
                  <div className="mt-3 flex-1 space-y-2">
                    <div className={`h-3.5 w-full ${shimmer}`} />
                    <div className={`h-3.5 w-[92%] ${shimmer}`} />
                    <div className={`h-3.5 w-3/4 ${shimmer}`} />
                  </div>
                  <div className={`mt-4 h-10 w-full ${shimmer}`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Older versions */}
        <section className="border-border bg-bg2 border-b py-[64px] md:py-[88px]">
          <div className="landing-shell">
            <div className="border-border bg-card flex flex-col gap-5 rounded-[14px] border p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div className="max-w-[520px] flex-1 space-y-2.5">
                <div className={`h-3 w-32 ${shimmer}`} />
                <div className={`h-7 w-3/4 max-w-[320px] ${shimmer}`} />
                <div className={`h-4 w-full max-w-[460px] ${shimmer}`} />
              </div>
              <div className="flex flex-wrap gap-2.5">
                <div className={`h-9 w-36 ${shimmer}`} />
                <div className={`h-9 w-36 ${shimmer}`} />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-background py-[72px] md:py-[100px]">
          <div className="landing-shell">
            <div className="mb-10 max-w-[680px] space-y-3">
              <div className={`h-3 w-32 ${shimmer}`} />
              <div className={`h-8 w-2/3 max-w-[360px] ${shimmer}`} />
            </div>
            <div className="border-border divide-border divide-y rounded-[14px] border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card flex items-start justify-between gap-4 px-5 py-4 first:rounded-t-[14px] last:rounded-b-[14px] md:px-7 md:py-5"
                >
                  <div className={`h-4 w-3/4 max-w-[480px] ${shimmer}`} />
                  <div className={`size-4 shrink-0 ${shimmer}`} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
