import { describe, expect, it } from "vitest";

describe("backend market-provider credentials", () => {
  it("authenticates a lightweight CoinGecko request", async () => {
    const apiKey = process.env.COINGECKO_API_KEY;
    expect(apiKey, "COINGECKO_API_KEY must be configured").toBeTruthy();

    const requestPing = () => fetch("https://api.coingecko.com/api/v3/ping", {
      headers: { "x-cg-demo-api-key": apiKey || "" },
      signal: AbortSignal.timeout(8_000),
    });
    const response = await requestPing().catch(requestPing);
    expect(response.ok).toBe(true);
    expect(await response.json()).toHaveProperty("gecko_says");
  }, 24_000);
});
