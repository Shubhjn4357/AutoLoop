import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AutomationBuilder } from "@/components/automation/automation-builder";

afterEach(() => cleanup());

describe("AutomationBuilder", () => {
  it("renders flow controls and existing automations", () => {
    render(
      <AutomationBuilder
        automations={[
          {
            id: "auto_1",
            userId: "user_1",
            name: "Price reply",
            triggerType: "keyword",
            conditionOperator: "contains",
            condition: "price",
            responseTemplate: "Pricing starts at 999.",
            followUpTemplate: "Need anything else?",
            followUpDelayMinutes: 15,
            requireFollower: true,
            flowJson: JSON.stringify([
              { id: "reply", type: "reply", label: "Auto reply" },
            ]),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]}
        createAutomationAction={vi.fn()}
        toggleAutomationAction={vi.fn()}
        deleteAutomationAction={vi.fn()}
      />
    );

    expect(screen.getByText("Automation Flow")).toBeInTheDocument();
    expect(screen.getByLabelText(/Rule name/i)).toBeInTheDocument();
    expect(screen.getByText("Price reply")).toBeInTheDocument();
    expect(screen.getByText(/Follower condition required/i)).toBeInTheDocument();
  });
});

