import { describe, expect, it } from "vitest";

import { matchesAutomationCondition, parseFlowJson } from "@/lib/automation/rules";

describe("automation rules", () => {
  it("matches keyword conditions case-insensitively", () => {
    expect(matchesAutomationCondition("contains", "price", "What is the PRICE?")).toBe(true);
  });

  it("supports exact and prefix conditions", () => {
    expect(matchesAutomationCondition("equals", "hello", "hello")).toBe(true);
    expect(matchesAutomationCondition("starts_with", "order", "Order status")).toBe(true);
  });

  it("does not match invalid regex conditions", () => {
    expect(matchesAutomationCondition("regex", "(", "hello")).toBe(false);
  });

  it("parses valid flow JSON and ignores malformed input", () => {
    const parsed = parseFlowJson(
      JSON.stringify([{ id: "1", type: "reply", label: "Auto reply" }])
    );

    expect(parsed).toHaveLength(1);
    expect(parseFlowJson("{bad json")).toEqual([]);
  });
});

