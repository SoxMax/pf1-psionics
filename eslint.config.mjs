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
        window: "readonly",
        document: "readonly",
        console: "readonly",
        
        // Node globals
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        
        // Foundry VTT globals
        game: "readonly",
        canvas: "readonly",
        ui: "readonly",
        CONFIG: "readonly",
        Hooks: "readonly",
        foundry: "readonly",
        pf1: "readonly",
        Item: "readonly",
        Actor: "readonly",
        DocumentSheetConfig: "readonly",
        libWrapper: "readonly",
        RollPF: "readonly",
        lang: "readonly",
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

