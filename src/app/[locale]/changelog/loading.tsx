import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";

const shimmer = "animate-pulse bg-foreground/10 rounded";

export default function ChangelogLoading() {
  return (
    <>
      <Navigation />
      <main aria-busy="true" aria-live="polite">
        <section className="border-border bg-background border-b pt-28 pb-14 md:pt-36 md:pb-20">
          <div className="landing-shell">
            <div className={`mb-7 h-3 w-56 ${shimmer}`} />
            <div className={`mb-3.5 h-3 w-32 ${shimmer}`} />
            <div className="space-y-3">
              <div className={`h-10 w-full max-w-[640px] ${shimmer}`} />
              <div className={`h-10 w-2/3 max-w-[420px] ${shimmer}`} />
            </div>
            <div className={`mt-6 h-4 w-full max-w-[560px] ${shimmer}`} />
            <div className={`mt-2 h-4 w-3/5 max-w-[360px] ${shimmer}`} />

            <div className="border-border bg-bg2/50 mt-9 flex flex-col gap-5 rounded-[14px] border p-6 md:flex-row md:items-center md:justify-between md:p-7">
              <div>
                <div className={`h-3 w-24 ${shimmer}`} />
                <div className="mt-3 flex items-baseline gap-3">
                  <div className={`h-8 w-28 ${shimmer}`} />
                  <div className={`h-3 w-32 ${shimmer}`} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className={`h-9 w-28 ${shimmer}`} />
                <div className={`h-9 w-28 ${shimmer}`} />
                <div className={`h-9 w-28 ${shimmer}`} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-[72px] md:py-[100px]">
          <div className="landing-shell">
            <ol className="m-0 list-none p-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="grid gap-x-6 gap-y-3 md:grid-cols-[160px_1fr]"
                >
                  <div className="md:sticky md:top-24 md:self-start">
                    <div className={`h-3 w-24 ${shimmer}`} />
                    <div className={`mt-2 h-3 w-20 ${shimmer}`} />
                  </div>
                  <article className="border-border bg-background mb-12 rounded-[14px] border p-6 md:p-8">
                    <div className="border-border flex items-center justify-between border-b pb-4">
                      <div className={`h-6 w-24 ${shimmer}`} />
                      <div className={`h-3 w-16 ${shimmer}`} />
                    </div>
                    <div className="mt-5 space-y-3">
                      <div className={`h-4 w-full ${shimmer}`} />
                      <div className={`h-4 w-[92%] ${shimmer}`} />
                      <div className={`h-4 w-[78%] ${shimmer}`} />
                      <div className={`h-4 w-[60%] ${shimmer}`} />
                    </div>
                    <div className="border-border mt-6 flex items-center justify-between border-t pt-4">
                      <div className={`h-4 w-32 ${shimmer}`} />
                      <div className="flex gap-2">
                        <div className={`h-7 w-20 ${shimmer}`} />
                        <div className={`h-7 w-20 ${shimmer}`} />
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
