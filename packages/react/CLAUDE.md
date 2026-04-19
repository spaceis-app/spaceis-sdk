# Claude Code configuration for @spaceis/react

This package uses **[AGENTS.md](./AGENTS.md)** as the canonical agent
instruction file — the same content applies to Claude Code.

Look there for:
- Architecture (src/ map, dual entry points)
- Domain conventions (Provider stability, useSyncExternalStore cart pattern,
  query key convention, staleTime defaults, usePlaceOrder cart-clear behaviour)
- Common mistakes (inline config prop, wrong cart API, missing Provider,
  unsafe innerHTML, wrong entry point import)
- Consumer integration (Next.js App Router SSR pattern)

Kept as a thin pointer so Claude Code's hierarchical CLAUDE.md loading still
works in this subfolder even on versions that don't yet read AGENTS.md natively.
