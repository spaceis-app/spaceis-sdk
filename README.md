# SpaceIS SDK

Official JavaScript SDK for the **SpaceIS** Minecraft shop platform.

## Packages

| Package | Description | npm |
|---|---|---|
| [`@spaceis/sdk`](./packages/sdk) | Core SDK — zero dependencies, works everywhere | `npm i @spaceis/sdk` |
| [`@spaceis/react`](./packages/react) | React hooks, Context Provider, Next.js SSR helpers | `npm i @spaceis/react` |

## Documentation

- [SDK README](./packages/sdk/README.md) — full API reference and usage examples
- [React README](./packages/react/README.md) — hooks, provider, SSR helpers
- [API Documentation](https://docs.spaceis.app/api#/) — SpaceIS REST API reference
- [Changelog](./CHANGELOG.md) — version history

## Examples

- [`examples/vanilla/`](./examples/vanilla/) — complete store using HTML + vanilla JS + SDK IIFE
- [`examples/react/`](./examples/react/) — Next.js App Router store with SSR, SEO, and all hooks

## Development

```bash
pnpm install
pnpm build       # Build all packages
pnpm test        # Run all tests
pnpm typecheck   # TypeScript check
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT
