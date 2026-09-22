import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Herramientas de agentes y skills, no código de la aplicación. Los
    // scripts de la skill de security-audit son CommonJS a propósito y
    // tumbaban `eslint .` desde que entraron en main.
    ".agents/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
