import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface ABTest {
  id: string;
  name: string;
  templateA: string;
  templateB: string;
  splitPercentage: number; // 50 means 50/50 split
  status: "active" | "completed" | "paused";
  startedAt: Date;
  completedAt?: Date;
  winner?: "A" | "B" | null;
}

/**
 * Create a new A/B test
 */
export async function createABTest(data: {
  userId: string;
  name: string;
  templateA: string;
  templateB: string;
  splitPercentage?: number;
}): Promise<ABTest> {
  const { userId, name, templateA, templateB, splitPercentage = 50 } = data;

  // Verify templates exist
  const [tempA, tempB] = await Promise.all([
    db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.id, templateA),
        eq(emailTemplates.userId, userId)
      ),
    }),
    db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.id, templateB),
        eq(emailTemplates.userId, userId)
      ),
    }),
  ]);

  if (!tempA || !tempB) {
    throw new Error("One or both templates not found");
  }

  // Create AB test record (you would need to add an abTests table)
  const abTest: ABTest = {
    id: nanoid(),
    name,
    templateA,
    templateB,
    splitPercentage,
    status: "active",
    startedAt: new Date(),
  };

  return abTest;
}

/**
 * Select template for A/B test based on split percentage
 */
export function selectABTestTemplate(
  test: ABTest,
  randomValue: number = Math.random()
): "A" | "B" {
  const threshold = test.splitPercentage / 100;
  return randomValue < threshold ? "A" : "B";
}

/**
 * Calculate statistical significance of A/B test
 * Uses chi-square test for proportions
 */
export function calculateStatisticalSignificance(
  conversionsA: number,
  totalA: number,
  conversionsB: number,
  totalB: number
): {
  pValue: number;
  isSignificant: boolean;
  confidenceLevel: number;
} {
  const rateA = conversionsA / totalA;
  const rateB = conversionsB / totalB;

  const pooledRate = (conversionsA + conversionsB) / (totalA + totalB);

  const standardError = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1 / totalA + 1 / totalB)
  );

  const zScore = (rateA - rateB) / standardError;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  return {
    pValue,
    isSignificant: pValue < 0.05,
    confidenceLevel: (1 - pValue) * 100,
  };
}

/**
 * Normal cumulative distribution function
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/**
 * Determine A/B test winner
 */
export async function determineABTestWinner(test: ABTest): Promise<{
  winner: "A" | "B" | null;
  confidence: number;
  recommendation: string;
}> {
  const { compareABTest } = await import("./analytics");
  const results = await compareABTest(test.templateA, test.templateB);

  const stats = calculateStatisticalSignificance(
    results.templateA.opened,
    results.templateA.sent,
    results.templateB.opened,
    results.templateB.sent
  );

  if (!stats.isSignificant) {
    return {
      winner: null,
      confidence: stats.confidenceLevel,
      recommendation: "Continue test - not enough data for statistical significance",
    };
  }

  const winner =
    results.templateA.openRate > results.templateB.openRate ? "A" : "B";

  return {
    winner,
    confidence: stats.confidenceLevel,
    recommendation: `Template ${winner} is the winner with ${stats.confidenceLevel.toFixed(1)}% confidence`,
  };
}

import { nanoid } from "nanoid";
import { and } from "drizzle-orm";
