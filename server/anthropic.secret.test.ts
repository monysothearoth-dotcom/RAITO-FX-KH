import { describe, expect, it } from "vitest";

describe("ANTHROPIC_API_KEY", () => {
  it("authenticates against the Anthropic models endpoint without exposing the secret", async () => {
    const key = process.env.ANTHROPIC_API_KEY;
    expect(key).toMatch(/^sk-ant-/);
    const response = await fetch("https://api.anthropic.com/v1/models?limit=1", {
      headers: {
        "x-api-key": key || "",
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(15_000),
    });
    expect(response.ok).toBe(true);
    const payload = await response.json() as { data?: unknown[] };
    expect(Array.isArray(payload.data)).toBe(true);
  }, 20_000);
});
