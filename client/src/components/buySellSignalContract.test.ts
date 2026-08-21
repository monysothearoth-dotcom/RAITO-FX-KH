import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (name: string) => readFileSync(resolve(process.cwd(), "client/src/components", name), "utf8");

describe("BUY/SELL-only signal UI contract", () => {
  it("does not retain HOLD labels or HOLD-specific styles", () => {
    const signalAnalyzer = source("SignalAnalyzer.tsx");
    const allInOne = source("AllInOneAiHub.tsx");
    expect(signalAnalyzer).not.toContain("HOLD");
    expect(allInOne).not.toContain("HOLD");
    expect(signalAnalyzer).toContain("recommendation: 'BUY' | 'SELL'");
  });
});
