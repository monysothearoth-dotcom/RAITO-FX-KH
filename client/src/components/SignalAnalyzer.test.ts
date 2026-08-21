import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Signal Analyze request contract", () => {
  it("retries transient failures and surfaces server errors", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/SignalAnalyzer.tsx"), "utf8");
    expect(source).toContain("for (let attempt = 0; attempt < 2; attempt += 1)");
    expect(source).toContain("cache: 'no-store'");
    expect(source).toContain("payload?.error ||");
    expect(source).toContain("/api/market-watch");
    expect(source).toContain("getRuntimeAiWatchPayload");
    expect(source).not.toContain("signal-analyzer-model-select");
  });
});
