# Claude Code configuration for SpaceIS SDK Monorepo

This repo uses **[AGENTS.md](./AGENTS.md)** as the canonical agent
instruction file — the same content applies to Claude Code.

Look there for:
- Repository layout (packages/ vs examples/, pnpm workspace scope)
- Package-manager conventions (pnpm only, `--ignore-workspace` for examples)
- Root commands (`pnpm build` / `typecheck` / `test` / `dev`)
- Domain invariants (prices in cents, quantities in thousandths, commission
  as multiplier, `product.unit` scope, cart token lifecycle)
- Raw-HTML field handling (DOMPurify / SafeHtml / sanitized computed)
- Open-redirect guards
- Package boundaries and publishing
- Where to drill down — each package and example has its own `AGENTS.md`

Kept as a thin pointer so Claude Code's hierarchical CLAUDE.md loading still
works at the repo root even on versions that don't yet read AGENTS.md
natively.
