import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Gold-only Auto Signal dashboard", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/components/AutoSignalAnalyze.tsx"), "utf8");

  it("identifies XAU/USD as the only monitored instrument", () => {
    expect(source).toContain("XAU/USD ONLY");
    expect(source).toContain("Gold-only focus");
    expect(source).toContain("qualified XAU/USD setup");
  });

  it("keeps BTC out of the Auto Signal dashboard presentation", () => {
    expect(source).not.toContain("BTC/USD");
    expect(source).not.toContain("Bitcoin focus");
  });

  it("shows continuous heartbeat and measured cadence for owner monitoring", () => {
    expect(source).toContain("Continuous tick:");
    expect(source).toContain("formatWorkerInterval");
    expect(source).toContain("Continuous 15s checks");
  });
});
