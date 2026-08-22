import { describe, expect, it } from "vitest";

describe("Alpha Vantage backend credential", () => {
  it("authenticates a lightweight server-side quote request", async () => {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    expect(apiKey, "ALPHA_VANTAGE_API_KEY must be configured").toBeTruthy();

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${encodeURIComponent(apiKey || "")}`,
    );
    expect(response.ok).toBe(true);

    const payload = await response.json() as Record<string, unknown>;
    expect(payload["Error Message"]).toBeUndefined();
    expect(Object.keys(payload).length).toBeGreaterThan(0);
  }, 20_000);
});
