# Claude Code configuration for @spaceis/vue

This package uses **[AGENTS.md](./AGENTS.md)** as the canonical agent
instruction file — the same content applies to Claude Code.

Look there for:
- Architecture (src/ map, dual entry points)
- Domain conventions (Plugin vs Provider, MaybeRefOrGetter params, shallowRef
  state, getCurrentInstance() SSR guard, cartManager nullability, query keys
  in computed(), usePlaceOrder cart-clear behaviour)
- Common mistakes (useCart outside setup, MaybeRef vs MaybeRefOrGetter,
  null cartManager in SSR, v-html without DOMPurify, wrong entry point import)
- Consumer integration (Nuxt SSR pattern)

Kept as a thin pointer so Claude Code's hierarchical CLAUDE.md loading still
works in this subfolder even on versions that don't yet read AGENTS.md natively.
