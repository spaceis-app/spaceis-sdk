# Claude Code configuration for examples/react

This example uses **[AGENTS.md](./AGENTS.md)** as the canonical agent
instruction file — the same content applies to Claude Code.

Look there for:

- Architecture (`src/app/`, `src/features/`, `src/components/`, `src/lib/`)
- Next.js App Router conventions (`ssr: false` on cart/checkout,
  SSR prefetch → `HydrationBoundary` pattern)
- Provider placement and cart-drawer state (`@tanstack/react-store`)
- `SafeHtml` / `isomorphic-dompurify` usage, open-redirect guard
- Commands (`pnpm dev` / `build` / `start` / `test`) and
  `--ignore-workspace` install requirement
- Testing (`vitest` + `jsdom` + `@testing-library/react`, 91 tests)
- Common mistakes to avoid

Kept as a thin pointer so Claude Code's hierarchical CLAUDE.md loading still
works in this subfolder even on versions that don't yet read AGENTS.md natively.
