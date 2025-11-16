import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // Base configuration for all files
  {
    files: ["**/*.mjs", "**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Browser globals
        console: "readonly",
        document: "readonly",
        window: "readonly",
        
        // Node globals
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        
        // Foundry VTT globals
        AbortController: "readonly",
        Actor: "readonly",
        Application: "readonly",
        CONFIG: "readonly",
        ChatMessage: "readonly",
        DocumentSheetConfig: "readonly",
        FormApplication: "readonly",
        HTMLInputElement: "readonly",
        Hooks: "readonly",
        Item: "readonly",
        RollPF: "readonly",
        TextEditor: "readonly",
        canvas: "readonly",
        foundry: "readonly",
        fromUuid: "readonly",
        game: "readonly",
        lang: "readonly",
        libWrapper: "readonly",
        pf1: "readonly",
        ui: "readonly",

        // jQuery global
        $: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      "no-console": "off",
      "semi": ["error", "always"],
      "quotes": ["error", "double", { avoidEscape: true }],
    },
  },
  
  // TypeScript configuration (if you add TypeScript files in the future)
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
  })),

  // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      "packs/**",
      "dist/**",
      "build/**",
      "*.min.js",
    ],
  },
];

