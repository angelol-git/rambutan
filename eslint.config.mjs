import js from "./client/node_modules/@eslint/js/src/index.js";
import globals from "./client/node_modules/globals/index.js";
import reactHooks from "./client/node_modules/eslint-plugin-react-hooks/index.js";
import reactRefresh from "./client/node_modules/eslint-plugin-react-refresh/index.js";
import tseslint from "./client/node_modules/typescript-eslint/dist/index.js";
import {
  defineConfig,
  globalIgnores,
} from "./client/node_modules/eslint/lib/config-api.js";

const tsNoUnusedVarsRule = [
  "error",
  {
    varsIgnorePattern: "^[A-Z_]",
    argsIgnorePattern: "^_",
    caughtErrorsIgnorePattern: "^_",
  },
];

export default defineConfig([
  globalIgnores([
    "client/dist",
    "server/dist",
    "client/src/components/kitchen/RecipeEditorLegacy/**",
    "server/scripts/benchmarkCreateTextOnly.js",
    "server/scripts/benchmarkUrlParse.js",
  ]),
  {
    files: ["client/**/*.{js,jsx,ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": tsNoUnusedVarsRule,
    },
  },
  {
    files: ["server/**/*.{js,ts}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": tsNoUnusedVarsRule,
    },
  },
]);
