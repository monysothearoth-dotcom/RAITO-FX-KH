import { describe, expect, it } from "vitest";
import { verifiedEventEvidenceLabel, verifiedHeadlineEvidenceLabel } from "./VerifiedEventEvidence";

describe("verified event evidence labels", () => {
  it("makes the absence or unavailability of high-impact events explicit", () => {
    expect(verifiedEventEvidenceLabel({ status: "no_upcoming_high_impact", checkedAt: 1, horizonHours: 24, source: "calendar", highImpactEvents: [] })).toContain("No verified high-impact calendar event");
    expect(verifiedEventEvidenceLabel({ status: "unavailable", checkedAt: 1, horizonHours: 24, source: "calendar", highImpactEvents: [] })).toContain("could not be verified");
    expect(verifiedEventEvidenceLabel({ status: "upcoming_high_impact", checkedAt: 1, horizonHours: 24, source: "calendar", highImpactEvents: [{ event: "CPI", currency: "USD", scheduledAt: 2, minutesUntil: 15 }] })).toContain("CPI");
  });

  it("reports whether headline evidence is supplied, absent, or unavailable", () => {
    expect(verifiedHeadlineEvidenceLabel({ status: "available", sourceFailures: [], headlines: [{ title: "Verified headline", source: "Example Feed", timestamp: 1, category: "forex", relatedCurrency: "EURUSD" }] })).toContain("1 verified headline supplied from Example Feed");
    expect(verifiedHeadlineEvidenceLabel({ status: "no_relevant_headlines", sourceFailures: [], headlines: [] })).toContain("No verified relevant headline");
    expect(verifiedHeadlineEvidenceLabel({ status: "unavailable", sourceFailures: ["Example Feed"], headlines: [] })).toContain("retrieval was unavailable");
  });
});
