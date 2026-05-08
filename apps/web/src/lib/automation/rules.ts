export * from "@autoloop/shared";
export * from "@autoloop/types";

// Keep UI-specific or legacy exports if needed, but primary logic is now shared
export const conditionOperators = [
  "any",
  "contains",
  "equals",
  "starts_with",
  "ends_with",
  "regex",
] as const;
