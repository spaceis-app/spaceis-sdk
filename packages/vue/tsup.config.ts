import { defineConfig } from "tsup";

export default defineConfig([
  // Main entry — client-side composables/plugin
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ["vue", "@spaceis/sdk", "@tanstack/vue-query"],
  },
  // Server entry — SSR/Nuxt prefetch helpers
  {
    entry: { server: "src/server/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["vue", "@spaceis/sdk", "@tanstack/vue-query"],
    treeshake: true,
  },
]);
