import { FlowBlock } from "@autoloop/types";
export declare function matchesAutomationCondition(operator: string | null | undefined, condition: string | null | undefined, messageText: string): boolean;
export declare function parseFlowJson(flowJson: string | null | undefined): FlowBlock[];
