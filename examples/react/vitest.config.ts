import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["__tests__/**/*.test.{ts,tsx}"],
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
