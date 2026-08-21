import { describe, expect, it } from "vitest";
import { classifyNewsImpact, classifyNewsSentiment } from "./marketData";

describe("Yahoo news classification", () => {
  it("derives positive and negative headline sentiment", () => {
    expect(classifyNewsSentiment("AAPL rallies after strong earnings beat")).toBe("positive");
    expect(classifyNewsSentiment("TSLA shares fall after weak guidance")).toBe("negative");
  });

  it("flags macro and earnings headlines as high impact", () => {
    expect(classifyNewsImpact("Fed FOMC guidance reshapes markets")).toBe("high");
    expect(classifyNewsImpact("Company launches a new product")).toBe("medium");
  });
});
