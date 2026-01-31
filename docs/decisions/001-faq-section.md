# ADR-001: FAQ Section Implementation Patterns

## Context

The project required a new FAQ section on the homepage. This section needed to be bilingual (ZH/EN), support multi-line answers, and maintain high performance without unnecessary client-side JavaScript.

## Decision

1. **Native HTML Accordion**: Use `<details>` and `<summary>` elements for the accordion functionality.
2. **Numbered i18n Keys**: Use structured keys like `item1.q`, `item1.a` under `landing.faq` instead of `t.raw` arrays.
3. **CSS-only Animations**: Use Tailwind's `group-open` modifier for icon rotation.
4. **Whitespace Handling**: Use `whitespace-pre-line` to render newline characters from JSON translation files.

## Consequences

- **Pros**:
  - Zero client-side JS for the accordion, improving TTI and performance.
  - Better type safety and maintainability for translations by avoiding raw arrays.
  - Accessible by default using native browser behavior.
- **Cons**:
  - Limited control over "exclusive" accordion behavior (only one item open at a time) without JS.
  - Manual management of numbered keys if the list grows very large.
