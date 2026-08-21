import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConsensusMetadata } from "./ConsensusMetadata";

describe("ConsensusMetadata", () => {
  it("renders the one selected setup with quality and risk metadata", () => {
    const html = renderToStaticMarkup(
      <ConsensusMetadata
        report={{
          watchMode: "unified",
          bestSetupOnly: true,
          selectedProvider: "gemini",
          setupScore: 91,
          riskReward: 3.2,
          agreementPercent: 67,
          providersAnalyzed: ["gemini", "openai", "platform"],
        }}
      />,
    );

    expect(html).toContain("1 best setup selected");
    expect(html).toContain("gemini · 91/100 quality");
    expect(html).toContain("3.2R risk/reward");
    expect(html).toContain("67% panel agreement · 3 analyzed");
    expect(html).toContain("market-watch-consensus");
  });

  it("does not render metadata for a non-unified report", () => {
    const html = renderToStaticMarkup(<ConsensusMetadata report={{ watchMode: "legacy" }} />);
    expect(html).toBe("");
  });
});
