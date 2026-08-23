import { describe, expect, it, vi } from "vitest";
import { callWithProviderFallback } from "./aiFallback";

describe("Anthropic completion fallback", () => {
  it("uses the server-managed platform fallback when an Anthropic completion is unavailable", async () => {
    const caller = vi.fn(async (provider: string) => {
      if (provider === "anthropic") throw new Error("provider credits unavailable");
      return '{"recommendation":"BUY"}';
    });
    const result = await callWithProviderFallback(
      "anthropic",
      "server-only-key",
      ["platform"],
      { platform: "internal" },
      [{ role: "user", content: "Validate fallback." }],
      caller,
    );
    expect(result).toMatchObject({ provider: "platform", attemptedProviders: ["anthropic", "platform"] });
    expect(result.failures[0]).toContain("anthropic:provider credits unavailable");
  });
});
