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
    expect(source).toContain("customPrompt: effectivePrompt");
    expect(source).not.toContain("getRuntimeAiWatchPayload");
    expect(source).not.toContain("signal-analyzer-model-select");
  });

  it("keeps provider and Telegram credentials out of the browser workflow", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/SignalAnalyzer.tsx"), "utf8");
    expect(source).toContain("Backend-managed AI and delivery");
    expect(source).toContain("Server-managed analysis");
    expect(source).not.toContain("signal-analyzer-api-key-input");
    expect(source).not.toContain("signal-analyzer-fallback-keys-input");
    expect(source).not.toContain("telegramBotToken");
    expect(source).not.toContain("customApiKey");
  });
});
