import { defineConfig } from "tsup";

export default defineConfig([
  // ESM + CJS + TypeScript declarations
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    minify: false,
    sourcemap: true,
    target: "es2020",
    treeshake: true,
  },
  // IIFE bundle for <script> tag (vanilla JS)
  {
    entry: { spaceis: "src/index.ts" },
    format: ["iife"],
    outExtension: () => ({ js: ".global.js" }),
    globalName: "SpaceIS",
    platform: "browser",
    minify: true,
    sourcemap: true,
    target: "es2020",
    footer: {
      // Flatten exports so SpaceIS.createSpaceIS() works, not SpaceIS.default.createSpaceIS()
      js: `if(typeof SpaceIS!=="undefined"&&SpaceIS.default){Object.assign(SpaceIS,SpaceIS.default);Object.keys(SpaceIS).forEach(function(k){if(typeof SpaceIS[k]==="object"&&SpaceIS[k]&&SpaceIS[k].default){Object.assign(SpaceIS[k],SpaceIS[k].default)}})}`,
    },
  },
]);
