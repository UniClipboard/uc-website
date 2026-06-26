"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Resets the window to the top of the page on client-side forward navigation.
 *
 * Next.js App Router only scrolls the *changed* route segment into view. When a
 * navigation descends into a nested segment that streams behind a `loading.tsx`
 * Suspense boundary (e.g. `/blog` -> `/blog/[slug]`), the viewport is left
 * parked partway down the new page instead of at its top, so the user lands in
 * the middle of the article rather than at its start.
 *
 * We force scroll-to-top on every pathname change, except:
 *   - the initial load (let the browser handle the hash target / reload position)
 *   - back/forward navigations (preserve native scroll restoration)
 *   - navigations that target an in-page anchor (`#hash`)
 *
 * The scroll is re-applied on the next animation frame as well, because Next can
 * re-run its segment scroll once the suspended content resolves and would
 * otherwise re-park the viewport mid-page.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  // Path the scroll effect last handled. Kept current on every navigation so the
  // popstate handler can distinguish a real route change from a hash-only one.
  const lastPathRef = useRef<string | null>(null);
  // True when the next pathname change originates from a back/forward navigation.
  const popRef = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      // popstate fires after the URL has updated. Only mark it as a route change
      // when the path actually differs — ignoring hash-only pops keeps the flag
      // from lingering into a subsequent forward navigation.
      if (window.location.pathname !== lastPathRef.current) {
        popRef.current = true;
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const isFirst = lastPathRef.current === null;
    lastPathRef.current = window.location.pathname;

    const wasPop = popRef.current;
    popRef.current = false;

    if (isFirst || wasPop) return;
    if (window.location.hash) return;

    window.scrollTo(0, 0);
    const raf = requestAnimationFrame(() => {
      if (!window.location.hash) window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
