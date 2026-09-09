import tseslint from "typescript-eslint";
export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: [
      "src/modules/coffee/**/*.ts",
      "src/modules/payments/**/*.ts",
      "src/workers/**/*.ts",
      "src/database/seed-coffee.ts",
      "tests/**/*.ts",
    ],
    extends: [...tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSUnknownKeyword",
          message: "Define an explicit contract.",
        },
        {
          selector: "TSAsExpression",
          message: "Validate values instead of casting.",
        },
      ],
    },
  },
);
