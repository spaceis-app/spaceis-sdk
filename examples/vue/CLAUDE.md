# Claude Code configuration for examples/vue

This example uses **[AGENTS.md](./AGENTS.md)** as the canonical agent
instruction file — the same content applies to Claude Code.

Look there for:

- Architecture (`pages/`, `components/` feature-grouped with
  `pathPrefix: false`, `composables/`, `utils/`, `plugins/spaceis.ts`)
- Nuxt conventions (`<ClientOnly>` on cart/checkout, `.client.vue` suffix,
  `cartManager` nullability in SSR, `getCurrentInstance()` lifecycle guard)
- DOMPurify via `v-html`, open-redirect guard, `useSeoMeta` patterns
- Commands (`pnpm dev` / `build` / `start` / `generate` / `test`) and
  `--ignore-workspace` install requirement
- Testing (`vitest` + `happy-dom` + `@vue/test-utils`, 79 tests,
  `@vitejs/plugin-vue ^5.2` pinning rationale)
- Common mistakes to avoid

Kept as a thin pointer so Claude Code's hierarchical CLAUDE.md loading still
works in this subfolder even on versions that don't yet read AGENTS.md natively.
