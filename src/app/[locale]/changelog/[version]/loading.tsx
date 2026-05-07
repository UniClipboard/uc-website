import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";

const shimmer = "animate-pulse bg-foreground/10 rounded";

export default function ChangelogVersionLoading() {
  return (
    <>
      <Navigation />
      <main aria-busy="true" aria-live="polite">
        <section className="border-border bg-background border-b pt-28 pb-12 md:pt-36 md:pb-14">
          <div className="landing-shell" style={{ maxWidth: 880 }}>
            <div className={`mb-7 h-3 w-64 ${shimmer}`} />
            <div className={`mb-3.5 h-3 w-32 ${shimmer}`} />
            <div className={`mb-4 h-12 w-40 ${shimmer}`} />
            <div className={`h-3 w-56 ${shimmer}`} />
          </div>
        </section>

        <section className="bg-background border-border border-b py-[56px] md:py-[80px]">
          <div className="landing-shell" style={{ maxWidth: 880 }}>
            <div className="flex flex-wrap gap-2">
              <div className={`h-9 w-32 ${shimmer}`} />
              <div className={`h-9 w-32 ${shimmer}`} />
              <div className={`h-9 w-32 ${shimmer}`} />
              <div className={`h-9 w-32 ${shimmer}`} />
            </div>

            <div className="mt-10 space-y-4">
              <div className={`h-7 w-1/3 ${shimmer}`} />
              <div className={`h-4 w-full ${shimmer}`} />
              <div className={`h-4 w-[92%] ${shimmer}`} />
              <div className={`h-4 w-[80%] ${shimmer}`} />
              <div className={`mt-8 h-7 w-2/5 ${shimmer}`} />
              <div className={`h-4 w-full ${shimmer}`} />
              <div className={`h-4 w-[88%] ${shimmer}`} />
              <div className={`h-4 w-[70%] ${shimmer}`} />
              <div className={`mt-8 h-7 w-1/4 ${shimmer}`} />
              <div className={`h-4 w-full ${shimmer}`} />
              <div className={`h-4 w-[85%] ${shimmer}`} />
            </div>
          </div>
        </section>

        <section className="bg-bg2 py-12">
          <div className="landing-shell" style={{ maxWidth: 880 }}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="border-border bg-background flex flex-col gap-2 rounded-[14px] border p-5">
                <div className={`h-3 w-20 ${shimmer}`} />
                <div className={`h-5 w-24 ${shimmer}`} />
                <div className={`h-3 w-32 ${shimmer}`} />
              </div>
              <div className="border-border bg-background flex flex-col items-end gap-2 rounded-[14px] border p-5">
                <div className={`h-3 w-20 ${shimmer}`} />
                <div className={`h-5 w-24 ${shimmer}`} />
                <div className={`h-3 w-32 ${shimmer}`} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
