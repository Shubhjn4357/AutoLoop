import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SimpleAutomationBuilder } from "@/components/automation/simple-automation-builder";

afterEach(() => cleanup());

describe("SimpleAutomationBuilder", () => {
  it("renders automation list with existing rules", () => {
    render(
      <SimpleAutomationBuilder
        userId="test_user"
        existingRules={[
          {
            id: "auto_1",
            name: "Price reply",
            triggerType: "dm",
            conditionOperator: "contains",
            condition: "price",
            dmTemplate: "Pricing starts at 999.",
            targetUrl: "https://example.com",
            followUpTemplate: "Need anything else?",
            followUpDelayMinutes: 15,
            followUp2DelayMinutes: 1440,
            requireFollower: true,
            aiEnabled: false,
            cooldownMinutes: 5,
            maxDailySends: 100,
            isActive: true,
            priority: 0,
          },
        ]}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Automations")).toBeInTheDocument();
    expect(screen.getByText("1 automation configured")).toBeInTheDocument();
    expect(screen.getByText("Price reply")).toBeInTheDocument();
    expect(screen.getByRole("switch", { checked: true })).toBeInTheDocument();
  });

  it("renders empty state when no automations exist", () => {
    render(
      <SimpleAutomationBuilder
        userId="test_user"
        existingRules={[]}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("No automations yet")).toBeInTheDocument();
    expect(screen.getByText(/Create your first automation/i)).toBeInTheDocument();
  });
});

