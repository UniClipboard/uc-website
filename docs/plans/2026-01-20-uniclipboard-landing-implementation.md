# UniClipboard Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a production-ready landing page for UniClipboard based on prototype.html with bilingual support (CN/EN), dark mode, and responsive design.

**Architecture:** Single-page landing page at `/` route with 8 section components. Uses Next.js 15, Tailwind CSS v4, next-intl for i18n, and next-themes for dark mode. Flat component structure in `src/components/landing/`.

**Tech Stack:** Next.js 15.5.4, React 19, TypeScript, Tailwind CSS v4, next-intl, next-themes, lucide-react, Manrope + Noto Sans SC fonts

---

## Task 1: Add Chinese Locale Support

**Files:**
- Modify: `src/i18n/routing.ts:1-8`
- Create: `messages/zh.json`

**Step 1: Update routing configuration to include Chinese**

```typescript
// src/i18n/routing.ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh"], // Changed from ["en", "pl"]

  defaultLocale: "en",
});
```

**Step 2: Create empty Chinese translation file**

```bash
touch messages/zh.json
```

**Step 3: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 4: Commit**

```bash
git add src/i18n/routing.ts messages/zh.json
git commit -m "feat: add Chinese locale support to routing"
```

---

## Task 2: Configure Font System

**Files:**
- Modify: `src/lib/fonts.ts:1-16`

**Step 1: Update font configuration**

```typescript
// src/lib/fonts.ts
import { Manrope, Noto_Sans_SC } from "next/font/google";

const fontSans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontChinese = Noto_Sans_SC({
  subsets: ["chinese-simplified"],
  variable: "--font-chinese",
  display: "swap",
});

export const fonts = `${fontChinese.variable} ${fontSans.variable}`;
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/lib/fonts.ts
git commit -m "feat: configure Manrope and Noto Sans SC fonts"
```

---

## Task 3: Update Tailwind Configuration

**Files:**
- Modify: `src/styles/globals.css:1-125`

**Step 1: Add custom colors and utilities to globals.css**

After line 42, before `@custom-variant dark`:

```css
@theme inline {
  /* ... existing theme ... */

  /* Custom UniClipboard colors */
  --color-primary: #334155;
  --color-gray-main: #F8FAFC;
  --color-gray-light: #F1F5F9;
  --color-gray-mid: #E2E8F0;
  --color-gray-dark: #1E293B;
  --color-silver-accent: #94A3B8;
  --color-charcoal: #0F172A;
}
```

After line 125, add custom utilities:

```css
/* Custom UniClipboard utilities */
@utility paper-texture {
  background-image:
    radial-gradient(circle at 2px 2px, rgba(0,0,0,0.02) 1px, transparent 0);
  background-size: 32px 32px;
}

@utility celestial-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10l1 1m20 5l1 1m-15 40l1 1m30-20l1 1m40 50l1 1' stroke='rgba(148, 163, 184, 0.1)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
}

@utility glass-panel {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.5);
}

@utility rounded-card {
  border-radius: 1.5rem;
}

.dark .glass-panel {
  background-color: rgba(15, 23, 42, 0.7);
  border-color: rgba(51, 65, 85, 0.5);
}
```

**Step 2: Verify CSS is valid**

Run: `npm run build` (check for CSS errors)
Expected: PASS (build succeeds)

**Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: add UniClipboard custom colors and utilities"
```

---

## Task 4: Create Form URL Configuration

**Files:**
- Create: `src/lib/form-config.ts`

**Step 1: Create form configuration file**

```typescript
// src/lib/form-config.ts
export const FORM_URLS = {
  zh: "https://docs.qq.com/form/page/[PLACEHOLDER]",
  en: "https://forms.google.com/[PLACEHOLDER]",
} as const;

export type Locale = keyof typeof FORM_URLS;

export function getFormUrl(locale: Locale): string {
  return FORM_URLS[locale] || FORM_URLS.en;
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/lib/form-config.ts
git commit -m "feat: add form URL configuration"
```

---

## Task 5: Create Landing Components Directory

**Files:**
- Create: `src/components/landing/` (directory)

**Step 1: Create components directory**

```bash
mkdir -p src/components/landing
```

**Step 2: Verify directory created**

Run: `ls -la src/components/landing`
Expected: Directory exists (empty)

**Step 3: Commit**

```bash
git add src/components/landing
git commit -m "feat: create landing components directory"
```

---

## Task 6: Create Navigation Component

**Files:**
- Create: `src/components/landing/Navigation.tsx`

**Step 1: Write Navigation component**

```typescript
// src/components/landing/Navigation.tsx
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getFormUrl } from "@/lib/form-config";

export async function Navigation({ locale }: { locale: string }) {
  const t = await getTranslations("landing.navigation");
  const formUrl = getFormUrl(locale as "zh" | "en");

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[1100px]">
      <nav className="glass-panel rounded-2xl px-8 py-4 flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="size-9 bg-gray-dark text-white flex items-center justify-center rounded-lg shadow-sm">
            <svg className="size-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-gray-dark dark:text-slate-100">UniClipboard</h2>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a className="text-xs font-bold text-slate-500 hover:text-gray-dark dark:hover:text-slate-100 transition-colors uppercase tracking-widest" href="#features">{t("features")}</a>
          <a className="text-xs font-bold text-slate-500 hover:text-gray-dark dark:hover:text-slate-100 transition-colors uppercase tracking-widest" href="#trust">{t("trust")}</a>
          <a className="text-xs font-bold text-slate-500 hover:text-gray-dark dark:hover:text-slate-100 transition-colors uppercase tracking-widest" href="#roadmap">{t("roadmap")}</a>
        </div>
        <a href={formUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-dark text-white text-xs font-bold px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-all uppercase tracking-wider">
          {t("cta")}
        </a>
      </nav>
    </header>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/components/landing/Navigation.tsx
git commit -m "feat: create Navigation component"
```

---

## Task 7: Create Hero Section Component

**Files:**
- Create: `src/components/landing/HeroSection.tsx`

**Step 1: Write Hero section component**

```typescript
// src/components/landing/HeroSection.tsx
import { getTranslations } from "next-intl/server";
import { getFormUrl } from "@/lib/form-config";
import { Bolt, Add, ContentCopy } from "lucide-react";

export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.hero");
  const formUrl = getFormUrl(locale as "zh" | "en");

  return (
    <section className="relative min-h-screen bg-white dark:bg-slate-900 paper-texture celestial-pattern flex items-center justify-center pt-32 pb-20">
      <div className="max-w-[900px] mx-auto px-6 text-center relative z-10">
        <div className="flex flex-col items-center gap-8">
          <span className="inline-block px-4 py-1.5 bg-gray-mid/30 dark:bg-slate-800/30 border border-gray-mid dark:border-slate-700 rounded-full text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            {t("badge")}
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight text-charcoal dark:text-slate-100">
            {t("title")} <span className="text-silver-accent">{t("highlight")}</span>
          </h1>
          <p className="text-lg md:text-xl font-medium text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {t("description")}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <a href={formUrl} target="_blank" rel="noopener noreferrer" className="px-10 py-4 bg-gray-dark text-white rounded-xl font-bold text-lg shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">
              {t("primaryCta")}
            </a>
            <a href="#" className="px-10 py-4 bg-white dark:bg-slate-800 border border-gray-mid dark:border-slate-700 text-gray-dark dark:text-slate-100 rounded-xl font-bold text-lg hover:bg-gray-light dark:hover:bg-slate-700 transition-all">
              {t("secondaryCta")}
            </a>
          </div>
        </div>
      </div>
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-4 text-slate-300 dark:text-slate-700 opacity-20">
        <Bolt className="size-10" />
        <Add className="size-10" />
        <ContentCopy className="size-10" />
      </div>
    </section>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/components/landing/HeroSection.tsx
git commit -m "feat: create HeroSection component"
```

---

## Task 8: Create Features Section Component

**Files:**
- Create: `src/components/landing/FeaturesSection.tsx`

**Step 1: Write Features section component**

```typescript
// src/components/landing/FeaturesSection.tsx
import { getTranslations } from "next-intl/server";
import { Zap, Sparkles, Shield, History } from "lucide-react";

const features = [
  { icon: Zap, key: "fast" },
  { icon: Sparkles, key: "minimalist" },
  { icon: Shield, key: "privacy" },
  { icon: History, key: "history" },
];

export async function FeaturesSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.features");

  return (
    <section id="features" className="bg-gray-light dark:bg-slate-900/50 py-32 relative celestial-pattern border-y border-gray-mid dark:border-slate-700">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-24 max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-white dark:bg-slate-800 border border-gray-mid dark:border-slate-700 rounded-full text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            {t("badge")}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-charcoal dark:text-slate-100 mb-6">
            {t("title")}
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.key} className="group p-10 bg-white dark:bg-slate-800 rounded-card border border-gray-mid dark:border-slate-700 hover:border-silver-accent transition-all flex flex-col gap-6 shadow-sm">
                <div className="size-14 bg-gray-light dark:bg-slate-700 rounded-xl flex items-center justify-center text-silver-accent group-hover:bg-gray-dark group-hover:text-white transition-all">
                  <Icon className="size-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-dark dark:text-slate-100">
                    {t(`${feature.key}.title`)}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                    {t(`${feature.key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/components/landing/FeaturesSection.tsx
git commit -m "feat: create FeaturesSection component"
```

---

## Task 9: Create Trust Section Component

**Files:**
- Create: `src/components/landing/TrustSection.tsx`

**Step 1: Write Trust section component**

```typescript
// src/components/landing/TrustSection.tsx
import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";

export async function TrustSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.trust");

  return (
    <section id="trust" className="bg-gray-dark dark:bg-slate-950 text-white py-32 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 text-center flex flex-col items-center gap-10 relative z-10">
        <div className="size-20 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
          <ShieldCheck className="size-10 text-silver-accent" />
        </div>
        <div className="max-w-2xl">
          <span className="inline-block px-4 py-1 bg-white/10 rounded-full text-silver-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            {t("badge")}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            {t("title")}
          </h2>
          <p className="text-xl text-slate-400 leading-relaxed font-medium">
            {t("description")}
          </p>
        </div>
        <a href="#" className="bg-white text-gray-dark text-sm px-10 py-4 rounded-xl font-bold hover:bg-gray-mid transition-all shadow-xl">
          {t("cta")}
        </a>
      </div>
      <div className="absolute top-0 right-0 w-1/3 h-full bg-white/[0.02] skew-x-12"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-white/[0.02] -rotate-12"></div>
    </section>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/components/landing/TrustSection.tsx
git commit -m "feat: create TrustSection component"
```

---

## Task 10: Create Roadmap Section Component

**Files:**
- Create: `src/components/landing/RoadmapSection.tsx`

**Step 1: Write Roadmap section component**

```typescript
// src/components/landing/RoadmapSection.tsx
import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";

export async function RoadmapSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.roadmap");

  const nowAvailable = [
    { key: "richText", icon: CheckCircle2 },
    { key: "images", icon: CheckCircle2 },
    { key: "crossPlatform", icon: CheckCircle2 },
  ];

  const comingSoon = [
    { key: "mobile", icon: null },
    { key: "largeFiles", icon: null },
    { key: "team", icon: null },
  ];

  return (
    <section id="roadmap" className="py-32 bg-white dark:bg-slate-900 paper-texture celestial-pattern">
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="text-center mb-24 flex flex-col items-center">
          <span className="inline-block px-4 py-1.5 bg-gray-light dark:bg-slate-800 border border-gray-mid dark:border-slate-700 rounded-full text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            {t("badge")}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-charcoal dark:text-slate-100">
            {t("title")}
          </h2>
        </div>
        <div className="space-y-12">
          <div className="bg-gray-light/50 dark:bg-slate-800/30 p-10 rounded-card border border-gray-mid dark:border-slate-700 hover:border-silver-accent transition-all">
            <div className="flex items-center gap-3 mb-8">
              <span className="px-3 py-1 bg-gray-dark text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                {t("nowAvailable.label")}
              </span>
              <div className="h-[1px] flex-grow bg-gray-mid dark:bg-slate-700"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {nowAvailable.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.key} className="space-y-2">
                    <p className="font-bold text-gray-dark dark:text-slate-100 flex items-center gap-2">
                      <Icon className="text-silver-accent" /> {t(`nowAvailable.${feature.key}.title`)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t(`nowAvailable.${feature.key}.description`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-10 rounded-card border border-gray-mid dark:border-slate-700 border-dashed">
            <div className="flex items-center gap-3 mb-8">
              <span className="px-3 py-1 bg-gray-mid text-slate-500 text-[10px] font-bold rounded-md uppercase tracking-wider">
                {t("comingSoon.label")}
              </span>
              <div className="h-[1px] flex-grow bg-gray-mid/50 dark:bg-slate-700/50"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {comingSoon.map((feature) => (
                <div key={feature.key} className="space-y-2 opacity-60">
                  <p className="font-bold text-gray-dark dark:text-slate-100">
                    {t(`comingSoon.${feature.key}.title`)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t(`comingSoon.${feature.key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/components/landing/RoadmapSection.tsx
git commit -m "feat: create RoadmapSection component"
```

---

## Task 11: Create Audience Section Component

**Files:**
- Create: `src/components/landing/AudienceSection.tsx`

**Step 1: Write Audience section component**

```typescript
// src/components/landing/AudienceSection.tsx
import { getTranslations } from "next-intl/server";

export async function AudienceSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.audience");

  const audiences = [
    { key: "developer" },
    { key: "creator" },
    { key: "designer" },
    { key: "admin" },
    { key: "geek" },
  ];

  return (
    <section className="py-32 bg-gray-light dark:bg-slate-900/50 overflow-hidden border-t border-gray-mid dark:border-slate-700 celestial-pattern">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col gap-16 items-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-center text-charcoal dark:text-slate-100 leading-tight">
            {t("title")}
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {audiences.map((audience) => (
              <span key={audience.key} className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-mid dark:border-slate-700 rounded-xl font-bold text-sm tracking-wide">
                {t(audience.key)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/components/landing/AudienceSection.tsx
git commit -m "feat: create AudienceSection component"
```

---

## Task 12: Create CTA Section Component

**Files:**
- Create: `src/components/landing/CtaSection.tsx`

**Step 1: Write CTA section component**

```typescript
// src/components/landing/CtaSection.tsx
import { getTranslations } from "next-intl/server";
import { getFormUrl } from "@/lib/form-config";

export async function CtaSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.cta");
  const formUrl = getFormUrl(locale as "zh" | "en");

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-32">
      <div className="bg-gray-dark dark:bg-slate-950 text-white rounded-[2rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/[0.03] rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col items-center gap-10 max-w-xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-silver-accent text-[10px] font-bold uppercase tracking-[0.2em]">
            {t("badge")}
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            {t("title")}
          </h2>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            {t("description")}
          </p>
          <form action={formUrl} method="get" target="_blank" className="w-full">
            <div className="w-full flex flex-col sm:flex-row gap-3 p-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
              <input name="email" type="email" required placeholder={t("placeholder")} className="flex-grow h-14 px-6 rounded-xl border-none bg-white text-gray-dark focus:ring-2 focus:ring-silver-accent outline-none font-bold text-base" />
              <button type="submit" className="h-14 px-8 bg-white text-gray-dark font-bold text-base rounded-xl hover:bg-gray-mid transition-all whitespace-nowrap">
                {t("button")}
              </button>
            </div>
          </form>
          <p className="text-xs font-bold text-slate-500 italic">
            {t("note")}
          </p>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/components/landing/CtaSection.tsx
git commit -m "feat: create CtaSection component"
```

---

## Task 13: Create Footer Component

**Files:**
- Create: `src/components/landing/Footer.tsx`

**Step 1: Write Footer component**

```typescript
// src/components/landing/Footer.tsx
import { getTranslations } from "next-intl/server";

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations("landing.footer");

  const links = [
    { key: "privacy", href: "#" },
    { key: "terms", href: "#" },
    { key: "twitter", href: "#" },
    { key: "github", href: "#" },
  ];

  return (
    <footer className="border-t border-gray-mid dark:border-slate-700 py-16 bg-white dark:bg-slate-900">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-gray-light dark:bg-slate-800 text-gray-dark dark:text-slate-100 flex items-center justify-center rounded-lg">
            <svg className="size-4" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-dark dark:text-slate-100">UniClipboard</span>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {links.map((link) => (
            <a key={link.key} className="hover:text-gray-dark dark:hover:text-slate-100 transition-colors" href={link.href}>
              {t(link.key)}
            </a>
          ))}
        </div>
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/components/landing/Footer.tsx
git commit -m "feat: create Footer component"
```

---

## Task 14: Create Chinese Translation File

**Files:**
- Modify: `messages/zh.json`

**Step 1: Write complete Chinese translations**

```json
{
  "landing": {
    "navigation": {
      "features": "功能特性",
      "trust": "安全隐私",
      "roadmap": "产品路线",
      "cta": "加入候补名单"
    },
    "hero": {
      "badge": "第一章：全平台同步",
      "title": "您的剪贴板，",
      "highlight": "在任何设备间即时同步。",
      "description": "安全、快速、无缝地在您的所有设备之间移动文本和图像。消除摩擦，让创意自由流动。",
      "primaryCta": "立即开启内测",
      "secondaryCta": "查看演示视频"
    },
    "features": {
      "badge": "第二章：核心价值",
      "title": "为何选择 UniClipboard",
      "subtitle": "为追求极致速度、纯粹极简和绝对安全的用户打造。",
      "fast": {
        "title": "极速同步",
        "description": "低于 50 毫秒的同步延迟。您的数据流动速度与思维同步。"
      },
      "minimalist": {
        "title": "极简主义",
        "description": "没有繁琐的菜单。通过原生系统快捷键在后台静默运行。"
      },
      "privacy": {
        "title": "绝对隐私",
        "description": "端到端加密确保只有您能查看数据。我们从不存储原始内容。"
      },
      "history": {
        "title": "无限历史",
        "description": "支持键盘搜索的完整历史记录。瞬间找回几周前的关键链接。"
      }
    },
    "trust": {
      "badge": "第三章：安全设计",
      "title": "您的数据，唯您可见",
      "description": "我们采用零知识加密技术，这意味着解密密钥永远不会离开您的设备。我们提供基础设施，而您拥有完全的数据控制权。",
      "cta": "查阅安全技术白皮书"
    },
    "roadmap": {
      "badge": "第四章：发展路线",
      "title": "产品路线图",
      "nowAvailable": {
        "label": "现已可用",
        "richText": {
          "title": "富文本同步",
          "description": "支持 Word, Docs 和 IDE 的格式保留。"
        },
        "images": {
          "title": "图像传输",
          "description": "Mac 端截图，Windows 端即时粘贴。"
        },
        "crossPlatform": {
          "title": "跨平台客户端",
          "description": "原生支持 macOS, Windows 和 Linux。"
        }
      },
      "comingSoon": {
        "label": "即将到来",
        "mobile": {
          "title": "移动端应用",
          "description": "iOS/Android 内部测试 Q4 启动。"
        },
        "largeFiles": {
          "title": "大文件同步",
          "description": "支持最高 1GB 的文件剪贴板传输。"
        },
        "team": {
          "title": "团队共享空间",
          "description": "为设计和开发团队打造的协作剪贴板。"
        }
      }
    },
    "audience": {
      "title": "为现代工作流而生",
      "developer": "开发者",
      "creator": "内容创作者",
      "designer": "UI/UX 设计师",
      "admin": "系统管理员",
      "geek": "极客用户"
    },
    "cta": {
      "badge": "最终章",
      "title": "加入私人测试",
      "description": "我们正在逐步开放访问权限。立即申请排队，成为首批受邀用户。",
      "placeholder": "输入您的电子邮箱",
      "button": "获取优先访问权",
      "note": "无需信用卡。内测参与者将获得永久会员优惠。"
    },
    "footer": {
      "privacy": "隐私政策",
      "terms": "服务条款",
      "twitter": "推特 / X",
      "github": "GitHub",
      "copyright": "© 2024 UNICLIPBOARD."
    }
  }
}
```

**Step 2: Verify JSON is valid**

Run: `cat messages/zh.json | jq .` (if jq is installed) or `node -e "console.log(JSON.parse(require('fs').readFileSync('messages/zh.json', 'utf8')))"`

Expected: No syntax errors

**Step 3: Commit**

```bash
git add messages/zh.json
git commit -m "feat: add Chinese translations for landing page"
```

---

## Task 15: Update English Translation File

**Files:**
- Modify: `messages/en.json`

**Step 1: Update English translations with landing page content**

```json
{
  "home": {
    "signIn": "Sign in",
    "signOut": "Sign out",
    "subtitle": "A Next.js starter template, packed with features like TypeScript, Tailwind CSS, Next-auth, Eslint, Stripe, testing tools and more. Jumpstart your project with efficiency and style.",
    "getStartedButton": "Get started"
  },
  "landing": {
    "navigation": {
      "features": "Features",
      "trust": "Security",
      "roadmap": "Roadmap",
      "cta": "Join Waitlist"
    },
    "hero": {
      "badge": "Chapter 1: Cross-Platform Sync",
      "title": "Your clipboard,",
      "highlight": "instantly synced across all devices.",
      "description": "Move text and images between all your devices safely, quickly, and seamlessly. Eliminate friction and let creativity flow freely.",
      "primaryCta": "Start Private Beta",
      "secondaryCta": "Watch Demo Video"
    },
    "features": {
      "badge": "Chapter 2: Core Values",
      "title": "Why Choose UniClipboard",
      "subtitle": "Built for users who demand extreme speed, pure minimalism, and absolute security.",
      "fast": {
        "title": "Lightning Fast",
        "description": "Sync latency under 50ms. Your data flows as fast as your thoughts."
      },
      "minimalist": {
        "title": "Minimalist Design",
        "description": "No cluttered menus. Runs silently in the background with native system shortcuts."
      },
      "privacy": {
        "title": "Absolute Privacy",
        "description": "End-to-end encryption ensures only you can view your data. We never store raw content."
      },
      "history": {
        "title": "Unlimited History",
        "description": "Complete searchable history. Instantly find that crucial link from weeks ago."
      }
    },
    "trust": {
      "badge": "Chapter 3: Security Design",
      "title": "Your Data, Yours Alone",
      "description": "We use zero-knowledge encryption, meaning decryption keys never leave your device. We provide the infrastructure, and you retain complete data control.",
      "cta": "Read Security Whitepaper"
    },
    "roadmap": {
      "badge": "Chapter 4: Development Roadmap",
      "title": "Product Roadmap",
      "nowAvailable": {
        "label": "Now Available",
        "richText": {
          "title": "Rich Text Sync",
          "description": "Preserve formatting from Word, Docs, and IDEs."
        },
        "images": {
          "title": "Image Transfer",
          "description": "Screenshot on Mac, paste instantly on Windows."
        },
        "crossPlatform": {
          "title": "Cross-Platform Clients",
          "description": "Native support for macOS, Windows, and Linux."
        }
      },
      "comingSoon": {
        "label": "Coming Soon",
        "mobile": {
          "title": "Mobile Apps",
          "description": "iOS/Android private beta launches in Q4."
        },
        "largeFiles": {
          "title": "Large File Sync",
          "description": "Transfer clipboard files up to 1GB."
        },
        "team": {
          "title": "Team Shared Spaces",
          "description": "Collaborative clipboard for design and dev teams."
        }
      }
    },
    "audience": {
      "title": "Built for Modern Workflows",
      "developer": "Developers",
      "creator": "Content Creators",
      "designer": "UI/UX Designers",
      "admin": "System Admins",
      "geek": "Power Users"
    },
    "cta": {
      "badge": "Final Chapter",
      "title": "Join Private Beta",
      "description": "We're gradually opening access. Apply now to get on the waitlist for early access.",
      "placeholder": "Enter your email",
      "button": "Get Early Access",
      "note": "No credit card required. Beta testers get lifetime membership discount."
    },
    "footer": {
      "privacy": "Privacy Policy",
      "terms": "Terms of Service",
      "twitter": "Twitter / X",
      "github": "GitHub",
      "copyright": "© 2024 UNICLIPBOARD."
    }
  }
}
```

**Step 2: Verify JSON is valid**

Run: `cat messages/en.json | jq .` or `node -e "console.log(JSON.parse(require('fs').readFileSync('messages/en.json', 'utf8')))"`
Expected: No syntax errors

**Step 3: Commit**

```bash
git add messages/en.json
git commit -m "feat: add English translations for landing page"
```

---

## Task 16: Update Main Page Component

**Files:**
- Modify: `src/app/[locale]/page.tsx:1-71`

**Step 1: Replace home page with landing page components**

```typescript
// src/app/[locale]/page.tsx
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { RoadmapSection } from "@/components/landing/RoadmapSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

const LandingPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;

  return (
    <>
      <Navigation locale={locale} />
      <main>
        <HeroSection locale={locale} />
        <FeaturesSection locale={locale} />
        <TrustSection locale={locale} />
        <RoadmapSection locale={locale} />
        <AudienceSection locale={locale} />
        <CtaSection locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
};

export default LandingPage;
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "feat: replace home page with UniClipboard landing page"
```

---

## Task 17: Update Site Configuration

**Files:**
- Modify: `src/lib/site-config.ts:1-11`

**Step 1: Update site metadata**

```typescript
// src/lib/site-config.ts
import { env } from "@/env.mjs";

export const siteConfig = {
  title: "UniClipboard | Safe & Efficient Universal Clipboard",
  description:
    "Secure, fast, and seamless clipboard synchronization across all your devices. Move text and images between devices with end-to-end encryption.",
  keywords: [
    "UniClipboard",
    "clipboard",
    "cross-platform",
    "synchronization",
    "E2E encryption",
    "productivity",
  ],
  url: env.APP_URL,
  googleSiteVerificationId: env.GOOGLE_SITE_VERIFICATION_ID || "",
};
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/lib/site-config.ts
git commit -m "feat: update site config for UniClipboard"
```

---

## Task 18: Update Global Styles for Body Font

**Files:**
- Modify: `src/styles/globals.css:113-120`

**Step 1: Update body styles to use new font stack**

Replace the body style in `@layer base`:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-chinese), var(--font-sans), system-ui, sans-serif;
  }
}
```

**Step 2: Verify CSS is valid**

Run: `npm run build`
Expected: PASS (build succeeds)

**Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: update body font stack for Chinese and English"
```

---

## Task 19: Update Layout to Apply New Fonts

**Files:**
- Modify: `src/app/[locale]/layout.tsx:1-77`

**Step 1: Update layout to use new font configuration**

No changes needed - the `fonts` import from `@/lib/fonts` already uses the updated export.

**Step 2: Verify the build**

Run: `npm run build`
Expected: PASS (build succeeds, fonts are loaded)

**Step 3: No commit needed**

Skip this step - Task 2 already updated the fonts.

---

## Task 20: Build and Verify

**Files:**
- (No specific files)

**Step 1: Run full build**

Run: `npm run build`
Expected: PASS (no errors, production build succeeds)

**Step 2: Run development server**

Run: `npm run dev`
Expected: Server starts successfully on port 3000

**Step 3: Manual verification checklist**

Open `http://localhost:3000` and verify:
- [ ] Page loads without errors
- [ ] Navigation displays correctly
- [ ] All sections are visible (Hero, Features, Trust, Roadmap, Audience, CTA, Footer)
- [ ] Language switcher toggles between Chinese and English
- [ ] Theme switcher toggles between light and dark modes
- [ ] All buttons and links work
- [ ] Responsive design works (try mobile, tablet, desktop widths)
- [ ] No console errors

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete UniClipboard landing page implementation"
```

---

## Testing Commands

After implementation, use these commands to verify:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build production
npm run build

# Start development server
npm run dev

# Run tests (if any are added)
npm test

# Run E2E tests (if any are added)
npm run e2e
```

---

## Implementation Notes

1. **Auth Code Preservation**: All existing authentication code remains in place but is not used on the landing page
2. **Form URLs**: Update `FORM_URLS` in `src/lib/form-config.ts` with actual form URLs when available
3. **Video Link**: Update the "Watch Demo Video" button href from `#` to actual video URL when available
4. **Whitepaper Link**: Update the "Read Security Whitepaper" button href from `#` to actual whitepaper URL when available
5. **Footer Links**: Update footer links to actual pages when implemented
6. **Dark Mode**: All components use `dark:` prefixes for dark mode variants
7. **Responsive Design**: Mobile-first approach with `md:` and `lg:` breakpoints

---

## Success Criteria

- ✅ All 8 section components created and integrated
- ✅ Chinese and English translations complete
- ✅ Dark mode works across all components
- ✅ Responsive design on mobile, tablet, and desktop
- ✅ No TypeScript errors
- ✅ No console errors in browser
- ✅ Production build succeeds
- ✅ All CTA buttons redirect to form URLs
- ✅ Language switcher works correctly
- ✅ Theme switcher works correctly
