import { describe, expect, it } from "vitest";

describe("USER_GEMINI_API_KEY", () => {
  it("authenticates against the Gemini models endpoint without exposing the secret", async () => {
    const key = process.env.USER_GEMINI_API_KEY;
    expect(key).toBeTruthy();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key || "")}`);
    expect(response.ok).toBe(true);
    const payload = await response.json() as { models?: unknown[] };
    expect(Array.isArray(payload.models)).toBe(true);
  }, 15000);
});
