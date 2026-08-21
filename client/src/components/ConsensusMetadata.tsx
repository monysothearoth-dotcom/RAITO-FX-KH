import React from "react";
import type { SignalReport } from "../types";

export function ConsensusMetadata({ report }: { report: Pick<SignalReport, "watchMode" | "bestSetupOnly" | "selectedProvider" | "setupScore" | "riskReward" | "agreementPercent" | "providersAnalyzed"> }) {
  if (report.watchMode !== "unified") return null;
  return (
    <div data-testid="market-watch-consensus" className="flex flex-wrap gap-1.5 text-[10px] font-mono font-semibold">
      <span data-testid="market-watch-best-setup" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">
        {report.bestSetupOnly ? "1 best setup selected" : "Unified setup"}
      </span>
      <span data-testid="market-watch-provider" className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-300">
        {report.selectedProvider || "market watch"} · {report.setupScore || 0}/100 quality
      </span>
      <span data-testid="market-watch-risk-reward" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300">
        {report.riskReward ? `${report.riskReward}R risk/reward` : "risk/reward reviewed"}
      </span>
      <span data-testid="market-watch-agreement" className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-violet-300">
        {report.agreementPercent || 0}% panel agreement · {report.providersAnalyzed?.length || 0} analyzed
      </span>
    </div>
  );
}
