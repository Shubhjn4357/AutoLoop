export const conditionOperators = [
  "any",
  "contains",
  "equals",
  "starts_with",
  "ends_with",
  "regex",
] as const;

export type ConditionOperator = (typeof conditionOperators)[number];

export interface FlowBlock {
  id: string;
  type: "trigger" | "condition" | "reply" | "follow_up";
  label: string;
}

export function isConditionOperator(value: string): value is ConditionOperator {
  return conditionOperators.includes(value as ConditionOperator);
}

export function matchesAutomationCondition(
  operator: string | null | undefined,
  condition: string | null | undefined,
  messageText: string
) {
  const normalizedOperator = isConditionOperator(operator ?? "")
    ? operator
    : "contains";
  const normalizedCondition = condition?.trim() ?? "";
  const normalizedMessage = messageText.trim();

  if (normalizedOperator === "any") {
    return true;
  }

  if (!normalizedCondition) {
    return false;
  }

  const messageLower = normalizedMessage.toLowerCase();
  const conditionLower = normalizedCondition.toLowerCase();

  switch (normalizedOperator) {
    case "contains":
      return messageLower.includes(conditionLower);
    case "equals":
      return messageLower === conditionLower;
    case "starts_with":
      return messageLower.startsWith(conditionLower);
    case "ends_with":
      return messageLower.endsWith(conditionLower);
    case "regex":
      try {
        return new RegExp(normalizedCondition, "i").test(normalizedMessage);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export function parseFlowJson(flowJson: string | null | undefined): FlowBlock[] {
  if (!flowJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(flowJson);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((block): block is FlowBlock => {
      return (
        typeof block?.id === "string" &&
        typeof block?.type === "string" &&
        typeof block?.label === "string" &&
        ["trigger", "condition", "reply", "follow_up"].includes(block.type)
      );
    });
  } catch {
    return [];
  }
}

