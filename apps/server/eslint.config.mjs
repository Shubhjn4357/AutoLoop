import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
    ],
  },
  {
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off", // Handled by TS
    }
  }
];
