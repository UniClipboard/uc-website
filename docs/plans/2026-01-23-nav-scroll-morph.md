# Navigation Scroll Morph Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Make the landing `Navigation` start as a full-width, square, non-glass top bar, then morph into a centered, rounded, glass floating nav once `scrollY > 64px`.

**Architecture:** Keep a single `Navigation` component with an `isCompact` state driven by `framer-motion` scroll position. Use `motion` layout/variants to animate width/position/radius/shadow, and a separate background layer that crossfades the glass material to avoid animating `backdrop-filter` directly.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, `framer-motion`, `next-intl`, `next-themes`, Jest + React Testing Library.

## Task 1: Add Framer Motion dependency

**Files:**
- Modify: `.worktrees/nav-scroll-morph/package.json`
- Modify: `.worktrees/nav-scroll-morph/package-lock.json`

**Step 1: Install dependency**

Run:
```bash
npm install framer-motion
```

**Step 2: Verify unit tests still run**

Run:
```bash
npm test
```

Expected: `Test Suites: 2 passed` (or whatever the repo currently has) and exit code 0.

## Task 2: Add failing tests for scroll morph

**Files:**
- Modify (Test): `.worktrees/nav-scroll-morph/src/__tests__/unit/navigation.spec.tsx`

**Step 1: Write failing test - expanded by default**

Add a test that asserts the nav renders with `data-nav-variant="expanded"` when scroll is at 0.

Example:
```tsx
it('starts expanded when scrollY <= 64', () => {
  // mock framer-motion scrollY to 0
  render(<Navigation />);
  expect(screen.getByTestId('nav-root')).toHaveAttribute('data-nav-variant', 'expanded');
});
```

**Step 2: Write failing test - becomes compact after scroll**

Mock `framer-motion` so that `useMotionValueEvent(scrollY, 'change', cb)` invokes `cb(100)`.

Example mock shape:
```ts
let mockScrollY = 0;
jest.mock('framer-motion', () => ({
  motion: { nav: 'nav', header: 'header', div: 'div' },
  useScroll: () => ({ scrollY: { get: () => mockScrollY } }),
  useMotionValueEvent: (_mv: unknown, _event: string, cb: (v: number) => void) => {
    cb(mockScrollY);
  },
}));
```

Then assert:
```tsx
mockScrollY = 100;
render(<Navigation />);
expect(screen.getByTestId('nav-root')).toHaveAttribute('data-nav-variant', 'compact');
```

**Step 3: Run test to verify it fails**

Run:
```bash
npm test -- src/__tests__/unit/navigation.spec.tsx
```

Expected: FAIL because `data-nav-variant` / `nav-root` do not exist yet.

## Task 3: Minimal implementation to pass tests (scroll state + data attributes)

**Files:**
- Modify: `.worktrees/nav-scroll-morph/src/components/landing/Navigation.tsx`
- Modify (Test): `.worktrees/nav-scroll-morph/src/__tests__/unit/navigation.spec.tsx`

**Step 1: Add `framer-motion` scroll-driven state**

Implement in `Navigation.tsx`:
- `import { motion, useMotionValueEvent, useScroll } from 'framer-motion'`
- `const { scrollY } = useScroll()`
- `const [isCompact, setIsCompact] = useState(false)`
- `useMotionValueEvent(scrollY, 'change', (v) => setIsCompact(v > 64))`

**Step 2: Add stable test hooks**

Add:
- `data-testid="nav-root"`
- `data-nav-variant={isCompact ? 'compact' : 'expanded'}`

**Step 3: Run tests to verify GREEN**

Run:
```bash
npm test -- src/__tests__/unit/navigation.spec.tsx
```

Expected: PASS.

## Task 4: Implement the morphing visuals (expanded <-> compact)

**Files:**
- Modify: `.worktrees/nav-scroll-morph/src/components/landing/Navigation.tsx`

**Step 1: Convert the container to motion + variants**

Use `motion.header` + `motion.nav` (or `motion.nav` only) and animate between two variants:
- expanded: full width, `rounded-none`, `bg-transparent`, `border-b ...`
- compact: centered `w-[95%] max-w-[1100px]`, `rounded-2xl`, `glass-panel`, `shadow-sm`, `top-6`

**Step 2: Add glass material crossfade layer**

Add a `motion.div` behind the nav content:
- expanded: `opacity: 0`
- compact: `opacity: 1` with `className="glass-panel ..."`

Keep the actual layout animation on the outer wrapper; keep the material change on this background layer.

**Step 3: Quick manual verification**

Run:
```bash
npm run dev
```

Scroll the landing page:
- At top: full width + square edges + transparent overlay
- After 64px: morphs into centered rounded glass floating nav

## Task 5: Verification

**Step 1: Unit tests**

Run:
```bash
npm test
```

Expected: exit code 0.

**Step 2: Typecheck**

Run:
```bash
npm run typecheck
```

Expected: exit code 0.

**Step 3: Lint**

Run:
```bash
npm run lint
```

Expected: 0 errors.

## Task 6: Commits (suggested)

```bash
git add src/components/landing/Navigation.tsx src/__tests__/unit/navigation.spec.tsx package.json package-lock.json
git commit -m "feat(nav): morph navigation on scroll"
```
