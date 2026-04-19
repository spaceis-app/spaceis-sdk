import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import vuePlugin from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

// Vue 3 Composition API symbols exposed by Nuxt's auto-import.
const vueAutoImports = {
  ref: "readonly",
  shallowRef: "readonly",
  computed: "readonly",
  reactive: "readonly",
  readonly: "readonly",
  watch: "readonly",
  watchEffect: "readonly",
  onMounted: "readonly",
  onUnmounted: "readonly",
  onBeforeMount: "readonly",
  onBeforeUnmount: "readonly",
  nextTick: "readonly",
  provide: "readonly",
  inject: "readonly",
  defineComponent: "readonly",
  defineProps: "readonly",
  defineEmits: "readonly",
  defineExpose: "readonly",
  toRef: "readonly",
  toRefs: "readonly",
  toValue: "readonly",
  unref: "readonly",
  isRef: "readonly",
  getCurrentInstance: "readonly",
};

// Nuxt 3/4 auto-imported composables used by examples/vue.
const nuxtAutoImports = {
  useHead: "readonly",
  useSeoMeta: "readonly",
  useRoute: "readonly",
  useRouter: "readonly",
  useRuntimeConfig: "readonly",
  useState: "readonly",
  useFetch: "readonly",
  useAsyncData: "readonly",
  useNuxtApp: "readonly",
  useCookie: "readonly",
  navigateTo: "readonly",
  createError: "readonly",
  clearError: "readonly",
  defineNuxtPlugin: "readonly",
  defineNuxtRouteMiddleware: "readonly",
  defineEventHandler: "readonly",
  definePageMeta: "readonly",
  // Project-local auto-imports (composables/, components/)
  useCartDrawer: "readonly",
  useToast: "readonly",
  useFocusTrap: "readonly",
};

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.next/**", "**/.nuxt/**", "**/.output/**"],
  },

  eslint.configs.recommended,

  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
  })),
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "warn",
    },
  },

  // React hooks rules — applied to TSX/JSX files
  {
    files: ["**/*.tsx", "**/*.jsx"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        sourceType: "module",
      },
    },
    plugins: {
      vue: vuePlugin,
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...vuePlugin.configs["flat/recommended"].rules,
      // Defer unused-var detection to the TS-aware rule (avoids duplicate reports in .vue files).
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "warn",
      "vue/multi-word-component-names": "off",
    },
  },

  // Browser-runtime globals — examples/* all run in a browser context
  // (even the Next.js / Nuxt SSR examples have client bundles).
  {
    files: ["examples/**/*.{js,jsx,ts,tsx,vue}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Example code frequently destructures fields it doesn't (yet) use —
      // warn instead of failing the build.
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  // Vue 3 Composition API + Nuxt auto-imports (examples/vue only).
  {
    files: ["examples/vue/**/*.{ts,vue}"],
    languageOptions: {
      globals: {
        ...vueAutoImports,
        ...nuxtAutoImports,
      },
    },
  },

  // Node/vitest globals for test files and node-executed scripts.
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "packages/create/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
