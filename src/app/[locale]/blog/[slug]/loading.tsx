import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";

const shimmer = "animate-pulse bg-foreground/10 rounded";

export default function BlogArticleLoading() {
  return (
    <>
      <Navigation />
      <main aria-busy="true" aria-live="polite">
        <section className="border-border bg-background border-b pt-28 pb-14 md:pt-36 md:pb-20">
          <div className="landing-shell">
            <div className={`mb-7 h-3 w-56 ${shimmer}`} />
            <div className={`mb-3.5 h-3 w-40 ${shimmer}`} />
            <div className="space-y-3">
              <div className={`h-10 w-full max-w-[720px] ${shimmer}`} />
              <div className={`h-10 w-3/4 max-w-[560px] ${shimmer}`} />
            </div>
            <div className={`mt-6 h-4 w-full max-w-[640px] ${shimmer}`} />
            <div className={`mt-2 h-4 w-2/3 max-w-[440px] ${shimmer}`} />
          </div>
        </section>

        <section className="bg-background border-border border-b py-[64px] md:py-[88px]">
          <div className="landing-shell">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,760px)_220px] lg:items-start lg:justify-center xl:grid-cols-[minmax(0,760px)_260px]">
              <div className="min-w-0 space-y-4">
                <div className={`h-4 w-full ${shimmer}`} />
                <div className={`h-4 w-[92%] ${shimmer}`} />
                <div className={`h-4 w-[88%] ${shimmer}`} />
                <div className={`h-4 w-[70%] ${shimmer}`} />
                <div className={`mt-10 h-7 w-1/2 ${shimmer}`} />
                <div className={`h-4 w-full ${shimmer}`} />
                <div className={`h-4 w-[90%] ${shimmer}`} />
                <div className={`h-4 w-[85%] ${shimmer}`} />
                <div className={`mt-10 h-7 w-2/5 ${shimmer}`} />
                <div className={`h-4 w-full ${shimmer}`} />
                <div className={`h-4 w-[80%] ${shimmer}`} />
              </div>
              <aside className="order-first lg:sticky lg:top-24 lg:order-none">
                <nav
                  aria-hidden
                  className="border-border bg-bg2/50 rounded-lg border p-4 lg:bg-transparent"
                >
                  <div className={`mb-3 h-3 w-24 ${shimmer}`} />
                  <ol className="m-0 list-none space-y-3 p-0">
                    <li className={`h-3 w-[85%] ${shimmer}`} />
                    <li className={`h-3 w-[70%] ${shimmer}`} />
                    <li className={`h-3 w-[78%] ${shimmer}`} />
                    <li className={`h-3 w-[60%] ${shimmer}`} />
                  </ol>
                </nav>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
