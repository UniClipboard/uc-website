import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";

const shimmer = "animate-pulse bg-foreground/10 rounded";

function HeroSkeleton() {
  return (
    <section className="border-border bg-background border-b pt-28 pb-14 md:pt-36 md:pb-20">
      <div className="landing-shell">
        <div className={`mb-7 h-3 w-56 ${shimmer}`} />
        <div className={`mb-3.5 h-3 w-32 ${shimmer}`} />
        <div className="space-y-3">
          <div className={`h-10 w-full max-w-[720px] ${shimmer}`} />
          <div className={`h-10 w-3/4 max-w-[560px] ${shimmer}`} />
        </div>
        <div className={`mt-5 h-4 w-full max-w-[640px] ${shimmer}`} />
        <div className={`mt-2 h-4 w-2/3 max-w-[440px] ${shimmer}`} />
        <div className={`mt-7 h-4 w-full max-w-[680px] ${shimmer}`} />
        <div className={`mt-2 h-4 w-1/2 max-w-[360px] ${shimmer}`} />
        <div className={`mt-8 h-3 w-40 ${shimmer}`} />
      </div>
    </section>
  );
}

function TldrSkeleton() {
  return (
    <section className="bg-bg2 border-border border-b py-[72px] md:py-[100px]">
      <div className="landing-shell">
        <div className="grid items-start gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <div>
            <div className={`h-3 w-24 ${shimmer}`} />
            <div className={`mt-3.5 h-8 w-3/4 ${shimmer}`} />
          </div>
          <ul className="border-border flex list-none flex-col gap-3.5 border-t p-0 pt-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="grid items-baseline gap-3.5"
                style={{ gridTemplateColumns: "24px 1fr" }}
              >
                <div className={`h-3 w-5 ${shimmer}`} />
                <div className={`h-4 w-[92%] ${shimmer}`} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function TwoColumnSkeleton() {
  return (
    <section className="bg-background border-border border-b py-[72px] md:py-[100px]">
      <div className="landing-shell">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className={`h-3 w-24 ${shimmer}`} />
              <div className={`mt-3.5 mb-5 h-7 w-3/4 ${shimmer}`} />
              <div className={`h-4 w-full ${shimmer}`} />
              <div className={`mt-2 h-4 w-[90%] ${shimmer}`} />
              <div className={`mt-2 h-4 w-[78%] ${shimmer}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonTableSkeleton() {
  return (
    <section className="bg-background border-border border-b py-[72px] md:py-[100px]">
      <div className="landing-shell">
        <div className={`h-3 w-24 ${shimmer}`} />
        <div className={`mt-3.5 mb-9 h-8 w-2/3 ${shimmer}`} />
        <div className="border-border overflow-x-auto rounded-[14px] border">
          <div className="border-border bg-bg2 border-b px-5 py-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className={`h-3 w-20 ${shimmer}`} />
              <div className={`h-3 w-24 ${shimmer}`} />
              <div className={`h-3 w-24 ${shimmer}`} />
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-border border-b px-5 py-5 last:border-b-0"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div className={`h-4 w-3/4 ${shimmer}`} />
                <div className={`h-4 w-[90%] ${shimmer}`} />
                <div className={`h-4 w-[80%] ${shimmer}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepsSkeleton() {
  return (
    <section className="bg-bg2 border-border border-b py-[72px] md:py-[100px]">
      <div className="landing-shell">
        <div className="grid items-start gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <div>
            <div className={`h-3 w-24 ${shimmer}`} />
            <div className={`mt-3.5 h-8 w-3/4 ${shimmer}`} />
          </div>
          <ol className="border-border flex list-none flex-col gap-5 border-t p-0 pt-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="grid items-baseline gap-3.5"
                style={{ gridTemplateColumns: "28px 1fr" }}
              >
                <div className={`h-3 w-6 ${shimmer}`} />
                <div className="space-y-2">
                  <div className={`h-4 w-full ${shimmer}`} />
                  <div className={`h-4 w-[80%] ${shimmer}`} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function VerdictSkeleton() {
  return (
    <section className="bg-background border-border border-b py-[72px] md:py-[100px]">
      <div className="landing-shell">
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          <div className={`h-3 w-24 ${shimmer}`} />
          <div className={`mt-3.5 mb-6 h-8 w-3/4 ${shimmer}`} />
          <div className={`h-4 w-full ${shimmer}`} />
          <div className={`mt-2 h-4 w-[92%] ${shimmer}`} />
          <div className={`mt-2 h-4 w-[70%] ${shimmer}`} />
        </div>
      </div>
    </section>
  );
}

function FaqSkeleton() {
  return (
    <section className="bg-background border-border border-b py-[72px] md:py-[100px]">
      <div className="landing-shell">
        <div className="grid items-start gap-10 md:grid-cols-[1fr_1.6fr] md:gap-14">
          <div>
            <div className={`h-3 w-24 ${shimmer}`} />
            <div className={`mt-3.5 h-8 w-3/4 ${shimmer}`} />
          </div>
          <div className="border-border border-t">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-border border-b py-6">
                <div className={`mb-3 h-5 w-2/3 ${shimmer}`} />
                <div className={`h-4 w-full ${shimmer}`} />
                <div className={`mt-2 h-4 w-[80%] ${shimmer}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSkeleton() {
  return (
    <section className="bg-bg2 border-border border-b py-[72px] md:py-[100px]">
      <div className="landing-shell">
        <div
          className="border-border bg-background mx-auto rounded-[18px] border p-8 md:p-12"
          style={{ maxWidth: 880 }}
        >
          <div className={`h-3 w-24 ${shimmer}`} />
          <div className={`mt-3.5 mb-4 h-8 w-3/4 ${shimmer}`} />
          <div className={`h-4 w-full ${shimmer}`} />
          <div className={`mt-2 mb-7 h-4 w-[80%] ${shimmer}`} />
          <div className="flex flex-wrap items-center gap-3">
            <div className={`h-10 w-32 rounded-full ${shimmer}`} />
            <div className={`h-10 w-28 rounded-full ${shimmer}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ArticleLayoutSkeleton() {
  return (
    <>
      <Navigation />
      <main aria-busy="true" aria-live="polite">
        <HeroSkeleton />
        <TldrSkeleton />
        <TwoColumnSkeleton />
        <ComparisonTableSkeleton />
        <StepsSkeleton />
        <VerdictSkeleton />
        <FaqSkeleton />
        <CtaSkeleton />
      </main>
      <Footer />
    </>
  );
}
