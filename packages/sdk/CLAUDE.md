# Claude Code configuration for @spaceis/sdk

This package uses **[AGENTS.md](./AGENTS.md)** as the canonical agent
instruction file — the same content applies to Claude Code.

Look there for:
- Architecture (src/ map)
- Domain conventions (prices in cents, qty in thousandths, cart token lifecycle,
  payment method commission as a multiplier, raw-HTML field XSS warnings,
  `unit` field scope)
- Build / test / typecheck commands
- Public API surface and common mistakes

Kept as a thin pointer so Claude Code's hierarchical CLAUDE.md loading still
works in this subfolder even on versions that don't yet read AGENTS.md natively.
