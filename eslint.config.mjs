import pluginReact from "eslint-plugin-react";
import tseslint from "typescript-eslint";
import nextConfig from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "public/**",
      ".venv/**",
      "data/templates/**",
      "studio/.sanity/**",
      "studio/dist/**",
      "scripts/**",
      "Mixitup/**",
      "archive/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts"
    ]
  },
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  ...nextConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        projectService: true,
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      "react/no-unescaped-entities": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off"
    }
  },
  {
    files: ["scripts/**/*.{ts,tsx,js}"],
    languageOptions: {
      parserOptions: {
        // Skip type-aware linting for scripts that are excluded from tsconfig to avoid slow projectService setup
        projectService: false
      }
    }
  }
];
