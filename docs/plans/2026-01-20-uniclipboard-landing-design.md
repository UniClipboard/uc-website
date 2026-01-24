# UniClipboard Landing Page Design Document

**Date**: 2026-01-20
**Project**: UniClipboard Website
**Designer**: Claude + User Collaboration

## Overview

Implement a production-ready landing page for UniClipboard based on the provided HTML prototype. The page will be fully responsive, support Chinese and English languages, and include dark mode adaptation.

prototype.html

## Requirements

- **Target**: Implement prototype.html design in Next.js
- **Languages**: Chinese and English (next-intl)
- **Themes**: Light and dark mode (next-themes)
- **Components**: Create dedicated components to match design exactly
- **Architecture**: Flat structure (components in `src/components/landing/`)
- **Auth**: Preserve existing auth code but not use it
- **CTA**: Redirect to external form services (Tencent Form for CN, Google Form for EN)

---

## Chapter 1: Architecture Design

### Page Structure

Single landing page at `/` route with the following sections:

1. **Navigation Bar** - Fixed top, glassmorphism effect
2. **Hero Section** - Main headline, description, CTA buttons
3. **Features Section** - 4 feature cards with hover effects
4. **Trust Section** - Dark background, security emphasis
5. **Audience Section** - Target user tags
6. **CTA Section** - Email input + submit button (redirect to forms)
7. **Footer** - Copyright and links

### Technical Architecture

**Component Hierarchy**:

- `src/components/landing/` - All landing page components
- `src/app/[locale]/page.tsx` - Main landing page entry
- Break into reusable sub-components (Hero, Features, Trust, Audience, CTA, etc.)

**Styling Strategy**:

- Tailwind CSS v4
- Custom colors in `tailwind.config.ts`
- Dark mode support via `next-themes`
- Component variants via `class-variance-authority`

**Internationalization**:

- Keep `next-intl` configuration
- All text through `getTranslations`
- Form URLs managed via config

**External Links**:

- "立即开启内测" → Tencent Form (CN) / Google Form (EN)
- "查看演示视频" → Placeholder `#` or reserved video link
- Navigation "加入候补名单" → Form links

---

## Chapter 2: Component Design & Style System

### Component Breakdown

1. **Navigation.tsx**
   - Fixed positioning, glassmorphism
   - Logo area
   - Nav links (Features, Trust)
   - CTA button (form link)

2. **HeroSection.tsx**
   - Main headline and subheadline
   - Two CTA buttons
   - Decorative icons at bottom

3. **FeaturesSection.tsx**
   - 4 feature cards
   - Each card: icon, title, description
   - Hover state effects

4. **TrustSection.tsx**
   - Dark background
   - Security icon and description
   - CTA button (technical whitepaper)

5. **AudienceSection.tsx**
   - Section title
   - User tags (Developer, Creator, Designer, etc.)

6. **CtaSection.tsx**
   - Email input field
   - Submit button (form link)
   - Decorative background elements

7. **Footer.tsx**
   - Logo and copyright
   - Navigation links

### Custom Colors (tailwind.config.ts)

```typescript
colors: {
  primary: '#334155',      // Charcoal/Deep Slate
  'gray-main': '#F8FAFC',
  'gray-light': '#F1F5F9',
  'gray-mid': '#E2E8F0',
  'gray-dark': '#1E293B',
  'silver-accent': '#94A3B8',
  charcoal: '#0F172A',
}
```

### Custom Utility Classes

- `paper-texture`: Paper texture background pattern
- `celestial-pattern`: Celestial pattern background
- `glass-panel`: Glassmorphism panel effect
- `rounded-card`: Card border radius (1.5rem)

### Icon Strategy

- Use `lucide-react` icons (already in project)
- Alternative: Material Symbols (if needed)

---

## Chapter 3: Font Selection

### Selected: Noto Sans SC + Manrope

**Noto Sans SC** (Chinese)

- Google's open-source Chinese font
- Modern sans-serif design, clear and readable
- Full coverage of Simplified/Traditional Chinese
- Weight range: 100-900
- Consistent style with Manrope

**Manrope** (English)

- Font used in prototype
- Strong geometric feel, modern and minimalist
- Excellent screen rendering
- Perfect for product displays and headings

### Font Stack Configuration

```typescript
// src/lib/fonts.ts
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

export const fonts = [
  fontSans.variable,
  fontChinese.variable,
];

// CSS
font-family:
  var(--font-chinese),  // Chinese priority
  var(--font-sans),      // English secondary
  system-ui,
  sans-serif;
```

---

## Chapter 4: Responsive Design & Dark Mode

### Responsive Breakpoints

**Mobile (< 768px)**:

- Nav: Hide middle links, keep Logo + CTA only
- Hero title: `text-4xl`
- Feature cards: Single column (`grid-cols-1`)
- Reduce spacing

**Tablet (768px - 1024px)**:

- Nav: Full layout
- Hero title: Medium size
- Feature cards: 2 columns (`grid-cols-2`)
- Moderate spacing

**Desktop (> 1024px)**:

- Full design details
- Max-width containers (`max-w-[1200px]` or `max-w-[900px]`)

### Dark Mode Adaptation

**Color Mapping**:

- `bg-gray-main (#F8FAFC)` → `bg-slate-900`
- `bg-white` → `bg-slate-800`
- `text-charcoal (#0F172A)` → `text-slate-100`
- `text-slate-500` → `text-slate-400`
- `border-gray-mid (#E2E8F0)` → `border-slate-700`

**Special Handling**:

- Hero: Keep light background texture
- Glassmorphism: Darker background `bg-slate-900/70`
- Trust section (dark): Use even darker `bg-slate-950`
- Card shadows: Reduce or remove in dark mode

---

## Chapter 5: Internationalization

### Translation File Structure

**messages/zh.json**:

- Navigation text
- Hero headline and description
- 4 feature titles and descriptions
- Trust section content
- Audience tags
- CTA section text
- Footer links

**messages/en.json**:

- Corresponding English translations
- Professional, concise technical writing style

### Translation Strategy

**Headlines & Taglines**:

- Chinese: Concise and powerful (e.g., "您的剪贴板，在任何设备间即时同步")
- English: Corresponding translation, focus on conciseness

**Feature Descriptions**:

- Chinese: Four-character phrases (极速同步、极简主义、绝对隐私、无限历史)
- English: Word or phrase (Lightning Fast, Minimalist, Absolute Privacy, Unlimited History)

### Form URL Configuration

```typescript
const FORM_URLS = {
  zh: "https://docs.qq.com/form/page/[PLACEHOLDER]", // Tencent Form
  en: "https://forms.google.com/[PLACEHOLDER]", // Google Form
};
```

---

## Chapter 6: Performance & Implementation Details

### Performance Optimization

**Font Loading**:

- Use `display: 'swap'` to avoid FOIT
- Enable `preload: true`
- Subset fonts (Latin, Chinese-Simplified)

**Image Optimization**:

- Background patterns use SVG data URI (optimized)
- Use Next.js `<Image>` component for other images
- Enable blur placeholders

**Code Splitting**:

- Each section component independently imported
- Dynamic imports for non-critical components (if needed)

**CSS Optimization**:

- Tailwind JIT mode (enabled)
- Custom styles using CSS variables
- Avoid inline styles

### Implementation Details

**Glassmorphism Effect**:

```css
.glass-panel {
  @apply border border-slate-200/50 bg-white/70 backdrop-blur-md;
}

.dark .glass-panel {
  @apply border border-slate-700/50 bg-slate-900/70 backdrop-blur-md;
}
```

**Decorative Backgrounds**:

```css
.paper-texture {
  background-image: radial-gradient(
    circle at 2px 2px,
    rgba(0, 0, 0, 0.02) 1px,
    transparent 0
  );
  background-size: 32px 32px;
}

.celestial-pattern {
  background-image: url("data:image/svg+xml,...");
}
```

**Interactive States**:

- All buttons have hover and focus states
- Card hover effects (border color, icon color)
- Smooth transitions (`transition-all duration-300`)

**Accessibility**:

- Semantic HTML (`<nav>`, `<section>`, `<main>`, `<footer>`)
- Clear `aria-label` on buttons and links
- Color contrast meets WCAG standards

### SEO Optimization

**Metadata**:

```typescript
title: "UniClipboard | 安全高效的通用剪贴板",
description: "安全、快速、无缝地在您的所有设备之间移动文本和图像",
```

**Structured Data**:

- Add JSON-LD schema markup
- Product info, company info

---

## Chapter 7: Implementation Plan

### Phase 1: Foundation Setup (Highest Priority)

**Tasks**:

1. Configure font system (Manrope + Noto Sans SC)
2. Update Tailwind config (custom colors)
3. Create basic component structure
4. Setup i18n translation files
5. Add global CSS utility classes

**Deliverables**:

- Fonts load correctly
- Custom colors available
- Component folder structure established

### Phase 2: Core Components

**Tasks**:

1. Navigation component (fixed navbar + glassmorphism)
2. HeroSection component (hero + CTAs)
3. FeaturesSection component (4 feature cards)
4. Footer component (copyright + links)

**Deliverables**:

- Landing page frame visible
- Core content displayed
- Responsive layout working

### Phase 3: Complete & Optimize

**Tasks**:

1. TrustSection component (security section)
2. AudienceSection component (target users)
3. CtaSection component (email input)
4. Dark mode adaptation
5. Animations and interactions

**Deliverables**:

- Complete landing page
- Dark mode perfectly adapted
- All interactions working

### Phase 4: Testing & Polish

**Tasks**:

1. Responsive testing (mobile, tablet, desktop)
2. i18n testing (CN/EN switching)
3. Performance check (Lighthouse score)
4. Accessibility check (WAVE tool)
5. Cross-browser testing

**Deliverables**:

- Production-ready landing page
- Pass all test checks

---

## Key Principles

- ✅ Bilingual support (CN/EN via next-intl)
- ✅ Light + dark mode (next-themes)
- ✅ Exact prototype replication (dedicated components)
- ✅ Responsive design (Tailwind)
- ✅ Performance optimized (next/font, code splitting)
- ✅ Progressive implementation (4 phases)
- ✅ CTA redirects to external forms

---

## Next Steps

Once this design is approved, the implementation will follow the 4-phase plan outlined above, ensuring a systematic and quality-focused approach to building the UniClipboard landing page.
