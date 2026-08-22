import type { SignalReport } from "../types";

type EventEvidence = SignalReport["eventEvidence"];
type HeadlineEvidence = SignalReport["headlineEvidence"];

export function verifiedEventEvidenceLabel(evidence?: EventEvidence): string {
  if (!evidence || evidence.status === "unavailable") return "Calendar could not be verified; no high-impact event claim is made.";
  if (evidence.status === "no_upcoming_high_impact") return `No verified high-impact calendar event in the next ${evidence.horizonHours} hours.`;
  const first = evidence.highImpactEvents[0];
  return first ? `Verified high-impact event: ${first.event} (${first.currency}) in ${first.minutesUntil} minutes.` : "Verified high-impact-event status is active.";
}

export function VerifiedEventEvidence({ evidence }: { evidence?: EventEvidence }) {
  if (!evidence) return null;
  const isUpcoming = evidence.status === "upcoming_high_impact";
  const isUnavailable = evidence.status === "unavailable";
  const tone = isUpcoming ? "border-rose-400/30 bg-rose-400/10 text-rose-100" : isUnavailable ? "border-slate-700 bg-slate-900/80 text-slate-300" : "border-emerald-400/25 bg-emerald-400/5 text-emerald-100";
  return <div data-testid="verified-event-evidence" className={`rounded-lg border px-3 py-2 text-[10px] font-mono ${tone}`}><span className="font-black uppercase">Verified event check:</span> <span>{verifiedEventEvidenceLabel(evidence)}</span></div>;
}

export function verifiedHeadlineEvidenceLabel(evidence?: HeadlineEvidence): string {
  if (!evidence || evidence.status === "not_requested") return "Headline evidence was not requested for this analysis.";
  if (evidence.status === "unavailable") return "Headline retrieval was unavailable; no external headline claim is made.";
  if (evidence.status === "no_relevant_headlines") return "No verified relevant headline was supplied.";
  const sources = Array.from(new Set(evidence.headlines.map((item) => item.source))).slice(0, 2).join(", ");
  return `${evidence.headlines.length} verified headline${evidence.headlines.length === 1 ? "" : "s"} supplied${sources ? ` from ${sources}` : ""}.`;
}

export function VerifiedHeadlineEvidence({ evidence }: { evidence?: HeadlineEvidence }) {
  if (!evidence || evidence.status === "not_requested") return null;
  const tone = evidence.status === "available" ? "border-cyan-400/25 bg-cyan-400/5 text-cyan-100" : evidence.status === "unavailable" ? "border-slate-700 bg-slate-900/80 text-slate-300" : "border-amber-400/25 bg-amber-400/5 text-amber-100";
  return <div data-testid="verified-headline-evidence" className={`rounded-lg border px-3 py-2 text-[10px] font-mono ${tone}`}><span className="font-black uppercase">Verified headlines:</span> <span>{verifiedHeadlineEvidenceLabel(evidence)}</span></div>;
}
