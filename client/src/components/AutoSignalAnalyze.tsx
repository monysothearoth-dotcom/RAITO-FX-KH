import { useEffect, useMemo, useState } from "react";
import { Activity, BellRing, BrainCircuit, ChartNoAxesCombined, CircleAlert, Clock3, Cpu, LockKeyhole, Radio, ShieldCheck, SlidersHorizontal, Target, TrendingDown, TrendingUp, Trophy, XCircle } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../_core/hooks/useAuth";

type SignalStatus = "OPEN" | "TP_HIT" | "SL_HIT" | "EXPIRED" | "CANCELLED";

function signalStatusStyle(status: SignalStatus) {
  if (status === "OPEN") return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
  if (status === "TP_HIT") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (status === "SL_HIT") return "border-rose-400/30 bg-rose-400/10 text-rose-200";
  return "border-slate-700 bg-slate-800/70 text-slate-300";
}

function formatPrice(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number >= 1000 ? number.toLocaleString(undefined, { maximumFractionDigits: 2 }) : number.toFixed(number >= 10 ? 2 : 4);
}

function formatTime(value: Date | string | null | undefined) {
  if (!value) return "No monitor run recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No monitor run recorded" : date.toLocaleString();
}

export default function AutoSignalAnalyze() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const signalsQuery = trpc.autoSignals.list.useQuery(undefined, { refetchInterval: 10_000, refetchIntervalInBackground: true });
  const statusQuery = trpc.autoSignals.status.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 10_000, refetchIntervalInBackground: true });
  const deliveryHealthQuery = trpc.autoSignals.deliveryHealth.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 10_000, refetchIntervalInBackground: true });
  const enableMutation = trpc.autoSignals.enable.useMutation({ onSuccess: () => void statusQuery.refetch() });
  const disableMutation = trpc.autoSignals.disable.useMutation({ onSuccess: () => void statusQuery.refetch() });
  const thresholdsMutation = trpc.autoSignals.updateThresholds.useMutation({ onSuccess: () => void statusQuery.refetch() });
  const settings = statusQuery.data;
  const [thresholds, setThresholds] = useState({ minConfidence: 78, minScore: 82, minRiskReward: 1.8 });

  useEffect(() => {
    if (!settings) return;
    setThresholds({ minConfidence: Number(settings.minConfidence ?? 78), minScore: Number(settings.minScore ?? 82), minRiskReward: Number(settings.minRiskReward ?? 1.8) });
  }, [settings]);

  const signals = signalsQuery.data || [];
  const summary = useMemo(() => ({
    open: signals.filter((signal) => signal.status === "OPEN").length,
    wins: signals.filter((signal) => signal.status === "TP_HIT").length,
    losses: signals.filter((signal) => signal.status === "SL_HIT").length,
    preNews: signals.filter((signal) => signal.source === "PRE_NEWS").length,
  }), [signals]);
  const isManaging = Boolean(settings);
  const mutationMessage = enableMutation.error?.message || disableMutation.error?.message || thresholdsMutation.error?.message;

  return (
    <section className="flex flex-col gap-5" data-testid="auto-signal-analyze">
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/35 bg-[radial-gradient(circle_at_90%_0%,rgba(139,92,246,0.17),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(17,24,39,0.94))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-6">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-violet-200"><Radio className="h-3.5 w-3.5 animate-pulse" />Auto Signal Analyze <span className="rounded-full border border-violet-300/30 bg-violet-300/10 px-2 py-0.5 text-[9px]">XAU/USD + BTC/USD</span></div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Selective signals, persistent outcomes.</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">The monitor opens only one active setup per instrument, applies a transparent confluence gate, and claims the Telegram dispatch before it sends. The same canonical record drives the live ledger and the eventual TP or SL outcome.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3"><div className="rounded-xl border border-violet-300/15 bg-slate-950/45 px-3 py-2"><span className="block text-[9px] font-mono uppercase tracking-wider text-slate-500">Coverage</span><span className="mt-0.5 block text-[10px] font-bold text-violet-100">Gold + Bitcoin focus</span></div><div className="rounded-xl border border-violet-300/15 bg-slate-950/45 px-3 py-2"><span className="block text-[9px] font-mono uppercase tracking-wider text-slate-500">Guardrail</span><span className="mt-0.5 block text-[10px] font-bold text-violet-100">One live setup / asset</span></div><div className="rounded-xl border border-violet-300/15 bg-slate-950/45 px-3 py-2"><span className="block text-[9px] font-mono uppercase tracking-wider text-slate-500">Monitor</span><span className="mt-0.5 block text-[10px] font-bold text-violet-100">Continuous 15s checks</span></div></div>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-700/80 bg-slate-950/75 p-3 text-[11px] shadow-inner xl:min-w-72">
            <div className="flex items-center justify-between gap-4"><span className="font-mono uppercase text-slate-500">Monitor</span><span className={settings?.isEnabled ? "font-black text-emerald-300" : "font-black text-slate-400"}>{settings?.isEnabled ? "ACTIVE · 15 SEC" : "STANDBY"}</span></div>
            <div className="flex items-center gap-2 text-slate-400"><Clock3 className="h-3.5 w-3.5 text-violet-300" />{formatTime(settings?.lastRunAt)}</div>
            {settings?.lastError && <div className="flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-400/5 p-2 text-rose-200"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />{settings.lastError}</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Open signals", value: summary.open, Icon: Activity, style: "text-cyan-300" },
          { label: "TP outcomes", value: summary.wins, Icon: Trophy, style: "text-emerald-300" },
          { label: "SL outcomes", value: summary.losses, Icon: XCircle, style: "text-rose-300" },
          { label: "Gold pre-news", value: summary.preNews, Icon: BellRing, style: "text-amber-300" },
        ].map(({ label, value, Icon, style }) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-3 sm:p-4"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-mono uppercase text-slate-500">{label}</span><Icon className={`h-4 w-4 ${style}`} /></div><div className="mt-2 text-2xl font-black text-white">{value}</div></div>)}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-4 sm:p-5">
          <div className="flex flex-col gap-2 border-b border-slate-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div><div className="flex items-center gap-2"><ChartNoAxesCombined className="h-4 w-4 text-violet-300" /><h2 className="text-sm font-black uppercase tracking-wide text-white">Live signal ledger</h2></div><p className="mt-1 text-[11px] text-slate-500">Updates automatically from the persisted monitor state; no browser tab needs to remain open for lifecycle tracking.</p></div>
            <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-[9px] font-mono text-slate-400">REFRESH 10s</span>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {signalsQuery.isLoading && <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-center text-xs text-slate-500">Loading persistent signal records…</div>}
            {!signalsQuery.isLoading && !signals.length && <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-7 text-center"><BrainCircuit className="mx-auto h-6 w-6 text-violet-300" /><div className="mt-2 text-sm font-bold text-slate-200">No qualifying signals published yet</div><p className="mx-auto mt-1 max-w-md text-[11px] leading-relaxed text-slate-500">The engine deliberately suppresses lower-confidence conditions. Once an enabled monitor finds a qualified XAU/USD or BTC/USD setup, the website and Telegram receive the same saved signal.</p></div>}
            {signals.map((signal) => {
              const buy = signal.direction === "BUY";
              return <article key={signal.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition-colors hover:border-slate-700"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-black ${buy ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>{buy ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{signal.direction}</span><span className="text-sm font-black text-white">{signal.symbol}</span><span className={`rounded-full border px-2 py-0.5 text-[9px] font-mono ${signalStatusStyle(signal.status as SignalStatus)}`}>{signal.status.replace("_", " ")}</span>{signal.source === "PRE_NEWS" && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-black text-amber-200">15M PRE-NEWS</span>}</div><p className="mt-2 max-w-xl text-[11px] leading-relaxed text-slate-400">{signal.rationale}</p></div><div className="grid grid-cols-3 gap-2 text-right text-[10px] font-mono sm:min-w-64"><div><div className="text-slate-600">ENTRY</div><div className="mt-1 font-bold text-white">{formatPrice(signal.entryPrice)}</div></div><div><div className="text-slate-600">TP</div><div className="mt-1 font-bold text-emerald-300">{formatPrice(signal.takeProfit)}</div></div><div><div className="text-slate-600">SL</div><div className="mt-1 font-bold text-rose-300">{formatPrice(signal.stopLoss)}</div></div></div></div><div className="mt-3 grid gap-2 border-t border-slate-800 pt-3 text-[10px] text-slate-500 sm:grid-cols-4"><span>Confidence <b className="text-violet-200">{signal.confidence}%</b></span><span>Confluence <b className="text-violet-200">{signal.intelligenceScore}/100</b></span><span>R:R <b className="text-violet-200">{Number(signal.riskReward).toFixed(2)}</b></span><span>{signal.outcomeDetails || (signal.newsEvent ? `Event: ${signal.newsEvent}` : "Telegram queued from this record")}</span></div></article>;
            })}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-800 bg-slate-900/95 p-4 sm:p-5">
          <div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-amber-300" /><h2 className="text-sm font-black uppercase tracking-wide text-white">Confluence gate</h2></div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">These owner controls are intentionally inspectable. Higher thresholds trade signal frequency for stricter filtering.</p>
          {isManaging ? <div className="mt-4 flex flex-col gap-4"><label className="text-[10px] font-mono uppercase text-slate-500">Min confidence <b className="float-right text-violet-200">{thresholds.minConfidence}%</b><input aria-label="Minimum confidence" type="range" min="60" max="95" value={thresholds.minConfidence} onChange={(event) => setThresholds((current) => ({ ...current, minConfidence: Number(event.target.value) }))} className="mt-2 w-full accent-violet-400" /></label><label className="text-[10px] font-mono uppercase text-slate-500">Min confluence <b className="float-right text-violet-200">{thresholds.minScore}/100</b><input aria-label="Minimum confluence" type="range" min="60" max="95" value={thresholds.minScore} onChange={(event) => setThresholds((current) => ({ ...current, minScore: Number(event.target.value) }))} className="mt-2 w-full accent-violet-400" /></label><label className="text-[10px] font-mono uppercase text-slate-500">Min risk / reward <b className="float-right text-violet-200">{thresholds.minRiskReward.toFixed(1)}R</b><input aria-label="Minimum risk reward" type="range" min="1.1" max="4" step="0.1" value={thresholds.minRiskReward} onChange={(event) => setThresholds((current) => ({ ...current, minRiskReward: Number(event.target.value) }))} className="mt-2 w-full accent-violet-400" /></label><button onClick={() => thresholdsMutation.mutate(thresholds)} disabled={thresholdsMutation.isPending} className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-[10px] font-black uppercase text-violet-100 transition hover:bg-violet-400/20 disabled:opacity-50">{thresholdsMutation.isPending ? "Saving…" : "Save thresholds"}</button><button onClick={() => settings?.isEnabled ? disableMutation.mutate() : enableMutation.mutate()} disabled={enableMutation.isPending || disableMutation.isPending} className={`rounded-xl px-3 py-2.5 text-[10px] font-black uppercase transition disabled:opacity-50 ${settings?.isEnabled ? "bg-rose-400/10 text-rose-200 hover:bg-rose-400/20" : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"}`}>{settings?.isEnabled ? "Pause monitoring" : "Enable monitoring"}</button>{mutationMessage && <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-2 text-[10px] text-rose-200" role="alert">{mutationMessage}</div>}</div> : <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"><div className="flex items-center gap-2 text-xs font-bold text-slate-300"><LockKeyhole className="h-4 w-4 text-amber-300" />Owner controls</div><p className="mt-2 text-[11px] leading-relaxed text-slate-500">The live ledger is public to the dashboard. The project owner enables the recurring monitor and adjusts the criteria.</p></div>}
          {isManaging && deliveryHealthQuery.data && <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-3"><div className="flex items-center gap-2 text-[10px] font-black uppercase text-cyan-200"><Cpu className="h-3.5 w-3.5" />Telegram delivery health</div><div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px]"><div><div className="font-black text-white">{deliveryHealthQuery.data.signalDeliveries}</div><div className="text-slate-500">signals</div></div><div><div className="font-black text-white">{deliveryHealthQuery.data.outcomeDeliveries}</div><div className="text-slate-500">outcomes</div></div><div><div className={deliveryHealthQuery.data.pending ? "font-black text-amber-200" : "font-black text-emerald-200"}>{deliveryHealthQuery.data.pending}</div><div className="text-slate-500">pending</div></div></div>{(deliveryHealthQuery.data.retrying || deliveryHealthQuery.data.dispatching || deliveryHealthQuery.data.uncertain) ? <div className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-2 py-1.5 text-[9px] leading-relaxed text-amber-100">Retrying: {deliveryHealthQuery.data.retrying} · Sending: {deliveryHealthQuery.data.dispatching} · Verify: {deliveryHealthQuery.data.uncertain}</div> : <div className="mt-2 text-[9px] text-emerald-200">No duplicate dispatches or unresolved delivery claims.</div>}</div>}
          <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-3"><div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-200"><ShieldCheck className="h-3.5 w-3.5" />Risk boundary</div><p className="mt-1 text-[10px] leading-relaxed text-slate-400">Signals are analytical scenarios, not guarantees or trade execution. High-impact Gold news is separated from the technical signal path and marked accordingly.</p></div>
        </aside>
      </div>
    </section>
  );
}
