# Claude Code configuration for SpaceIS PHP example

This example uses **[AGENTS.md](./AGENTS.md)** as the canonical agent
instruction file — the same content applies to Claude Code.

Look there for:
- Folder structure (`includes/` + `includes/js/` modules + PHP pages)
- How per-page `<script>` blocks coordinate with `includes/js/app.js`
  via `spaceis:ready`
- Domain conventions inherited from `@spaceis/sdk` (cents / thousandths /
  unit / commission multiplier / HTML sanitisation via `<template>` + DOMPurify)
- `SpaceISApp` global contract and when to register new functions
- Common AI-agent mistakes and consumer integration flow

Kept as a thin pointer so Claude Code's hierarchical CLAUDE.md loading
still picks up subfolder context on any version that doesn't yet read
AGENTS.md natively.
