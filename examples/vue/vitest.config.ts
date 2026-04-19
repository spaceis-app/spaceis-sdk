import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  define: {
    // Nuxt sets this to true on the client; vitest runs in Node/happy-dom
    // Value must be a serialized JS expression string for Vite's define to inject it
    "import.meta.client": "true",
  },
  test: {
    include: ["__tests__/**/*.test.ts"],
    environment: "happy-dom",
  },
  resolve: {
    alias: {
      "~": new URL(".", import.meta.url).pathname,
    },
  },
});