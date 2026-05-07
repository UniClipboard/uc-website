import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";

const shimmer = "animate-pulse bg-foreground/10 rounded";

export function ArticleHubSkeleton() {
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
              <div className={`h-10 w-3/4 max-w-[480px] ${shimmer}`} />
            </div>
            <div className={`mt-6 h-4 w-full max-w-[560px] ${shimmer}`} />
            <div className={`mt-2 h-4 w-2/3 max-w-[400px] ${shimmer}`} />
            <div className={`mt-8 h-3 w-32 ${shimmer}`} />
          </div>
        </section>

        <section className="bg-bg2 border-border border-b py-[72px] md:py-[100px]">
          <div className="landing-shell">
            <ul className="grid list-none gap-5 p-0 md:grid-cols-2 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="m-0">
                  <div className="border-border bg-background block h-full rounded-[14px] border p-7 md:p-8">
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`h-3 w-20 ${shimmer}`} />
                      <div className={`h-3 w-16 ${shimmer}`} />
                    </div>
                    <div className="space-y-2.5">
                      <div className={`h-6 w-full ${shimmer}`} />
                      <div className={`h-6 w-3/4 ${shimmer}`} />
                    </div>
                    <div className="mt-5 space-y-2">
                      <div className={`h-4 w-full ${shimmer}`} />
                      <div className={`h-4 w-[88%] ${shimmer}`} />
                      <div className={`h-4 w-[60%] ${shimmer}`} />
                    </div>
                    <div className={`mt-6 h-4 w-24 ${shimmer}`} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
