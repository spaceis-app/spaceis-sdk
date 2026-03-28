# Contributing to SpaceIS SDK

Thanks for your interest in contributing to the SpaceIS SDK!

## Getting started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/spaceis-sdk.git
   cd spaceis-sdk
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Build all packages:
   ```bash
   pnpm build
   ```

## Development workflow

```bash
pnpm dev         # Watch mode (all packages)
pnpm build       # Build all packages
pnpm typecheck   # TypeScript type checking
pnpm test        # Run all tests
```

### Package structure

```
packages/
  sdk/     — Core JavaScript SDK (zero dependencies)
  react/   — React hooks + Context Provider + SSR helpers
```

## Making changes

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```
2. Make your changes
3. Ensure everything passes:
   ```bash
   pnpm typecheck && pnpm build && pnpm test
   ```
4. Commit your changes with a clear message
5. Push and open a Pull Request

## Pull Request guidelines

- Keep PRs focused — one feature or fix per PR
- Update JSDoc if you change public API
- Add tests for new functionality
- Update CHANGELOG.md under an `[Unreleased]` section
- Fill out the PR template

## Code style

- TypeScript strict mode
- No runtime dependencies in `@spaceis/sdk`
- JSDoc on all public APIs (classes, methods, interfaces)
- Prices in cents, quantities in API thousandths — document conversions

## Reporting bugs

Use [GitHub Issues](https://github.com/spaceis-app/spaceis-sdk/issues) with the bug report template.

## Suggesting features

Use [GitHub Issues](https://github.com/spaceis-app/spaceis-sdk/issues) with the feature request template.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
