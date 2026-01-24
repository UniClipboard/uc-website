# Tailwind Theme Colors (Dark Mode) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update Tailwind theme colors to the provided config and ensure dark mode matches the new palette.

**Architecture:** This repo uses Tailwind CSS v4 with CSS-first theming. Theme tokens are defined in `@theme inline` and resolved through CSS variables in `:root` (light) and `.dark` (dark). Changes are concentrated in `src/styles/globals.css`, with optional updates in component class usage if token names change.

**Tech Stack:** Next.js, Tailwind CSS v4, shadcn/ui theme tokens, next-themes.

### Task 1: Confirm current theme surface and new config mapping

**Files:**

- Modify: `src/styles/globals.css`
- Optional: `prototype.html`

**Step 1: Inventory existing theme tokens**

- Identify current `@theme inline` color tokens and current `:root` / `.dark` variable values.
- Note any custom brand tokens (`--color-...`) and shadcn-style semantic tokens (`--background`, `--primary`, etc.).

**Step 2: Map provided config to tokens**

- Create a mapping table from provided color names to existing tokens.
- Decide whether any token names must change; prefer reusing existing token names when possible to avoid sweeping class changes.

**Step 3: Decide scope for prototype file**

- If `prototype.html` is expected to reflect the same theme, include it in the update; otherwise leave it unchanged and document the divergence.

### Task 2: Update theme token definitions

**Files:**

- Modify: `src/styles/globals.css`

**Step 1: Update `@theme inline` color tokens**

- Replace existing `--color-*` values with the provided config.
- Ensure semantic tokens still map to CSS variables (e.g., `--color-background: var(--background)`), unless the config requires direct values.

**Step 2: Update light mode variables**

- Update `:root` variables (e.g., `--background`, `--primary`, `--accent`, `--border`) to match the provided light palette.
- Keep non-color tokens (radii, spacing, fonts) unchanged.

**Step 3: Update dark mode variables**

- Update `.dark` variables to match the provided dark palette.
- Ensure contrast between `--background` and `--foreground` meets accessibility expectations.

### Task 3: Reconcile class usage if token names changed

**Files:**

- Modify: `src/components/landing/HeroSection.tsx`
- Modify: `src/components/landing/Navigation.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: other files that reference renamed tokens

**Step 1: Search for renamed color tokens**

- Locate Tailwind classes referencing the old color names (e.g., `text-charcoal`, `bg-gray-dark`).

**Step 2: Update classnames to the new token names**

- Replace deprecated tokens with the new names from the config.
- Avoid touching unrelated styling.

### Task 4: Validate theme behavior

**Files:**

- Modify: none

**Step 1: Lint and typecheck**

- Run: `npm run lint`
- Run: `npm run typecheck`
- Expected: both complete successfully.

**Step 2: Build**

- Run: `npm run build`
- Expected: build succeeds.

**Step 3: Visual verification**

- Run: `npm run dev`
- Check light mode and dark mode in the main landing pages for contrast, legibility, and brand color correctness.
