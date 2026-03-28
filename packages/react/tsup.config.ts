import { defineConfig } from "tsup";

export default defineConfig([
  // Main entry — client-side hooks/provider
  // "use client" banner signals to Next.js App Router that this is a Client Component boundary.
  // Note: treeshake is disabled for the client bundle so tsup uses esbuild (not rollup),
  // which correctly preserves the banner directive at the top of the output file.
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ["react", "@spaceis/sdk", "@tanstack/react-query"],
    banner: {
      js: '"use client";',
    },
    // treeshake intentionally left off for the client bundle:
    // when treeshake is enabled, tsup delegates to rollup which strips the banner.
    // esbuild (the default without treeshake) preserves it correctly.
  },
  // Server entry — SSR/RSC prefetch helpers
  // NO "use client" banner — runs in Next.js Server Components
  {
    entry: { server: "src/server/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "@spaceis/sdk", "@tanstack/react-query"],
    treeshake: true,
  },
]);
