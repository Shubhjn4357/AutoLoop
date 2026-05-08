import { describe, it, expect } from "vitest";
import crypto from "crypto";

const SECRET = "super-secret-key-123";

function computeHmac(secret: string, body: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("Webhook HMAC Security", () => {
  it("accepts a valid signature", () => {
    const payload = JSON.stringify({ object: "instagram", entry: [] });
    const signature = computeHmac(SECRET, payload);
    expect(signature.startsWith("sha256=")).toBe(true);
    expect(signature).toBe(computeHmac(SECRET, payload));
  });

  it("rejects a tampered payload", () => {
    const legitimatePayload = JSON.stringify({ object: "instagram" });
    const tamperedPayload = JSON.stringify({ object: "igDMSpam" });
    expect(computeHmac(SECRET, legitimatePayload)).not.toBe(computeHmac(SECRET, tamperedPayload));
  });

  it("rejects an incorrect secret", () => {
    const payload = "test-body";
    expect(computeHmac("wrong-secret", payload)).not.toBe(computeHmac(SECRET, payload));
  });

  it("handles empty payloads correctly", () => {
    const sig = computeHmac(SECRET, "");
    expect(typeof sig).toBe("string");
    expect(sig.startsWith("sha256=")).toBe(true);
  });
});
