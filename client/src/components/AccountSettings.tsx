import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, KeyRound, Save, ShieldCheck, Trash2 } from "lucide-react";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

const APP_LOCAL_KEYS = ["raito_fx_alerts", "watchlist_symbols", "raito_custom_api_key", "raito_ai_fallback_keys", "raito_tg_bot_token", "raito_tg_chat_id", "raito_api_provider", "raito_simulated_ticks"];

export function canDeleteAccount(confirmation: string) {
  return confirmation === "DELETE MY ACCOUNT";
}

export function formatAccountClock(date: Date, timezone: string | null | undefined) {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: timezone || "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "short" }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "short" }).format(date);
  }
}

export function accountSettingsLabel(theme: string | null | undefined) {
  return theme === "light" ? "Light" : theme === "system" ? "System" : "Dark";
}

export default function AccountSettings() {
  const utils = trpc.useUtils();
  const profileQuery = trpc.account.profile.useQuery();
  const updateProfile = trpc.account.updateProfile.useMutation({ onSuccess: () => utils.account.profile.invalidate() });
  const exportQuery = trpc.account.exportData.useQuery(undefined, { enabled: false });
  const deleteAccount = trpc.account.deleteAccount.useMutation();

  const profile = profileQuery.data;
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [defaultView, setDefaultView] = useState("all_in_one");
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [confirmation, setConfirmation] = useState("");
  const [clockNow, setClockNow] = useState(() => new Date());
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || profile.name || "");
    setTimezone(profile.timezone || "UTC");
    setDefaultView(profile.defaultView || "all_in_one");
    setTheme(profile.theme || "dark");
  }, [profile]);

  const profileSummary = useMemo(() => profile?.email || profile?.openId || "Authenticated account", [profile]);

  const savePreferences = async () => {
    setError(null);
    setNotice(null);
    try {
      await updateProfile.mutateAsync({ displayName: displayName.trim() || undefined, timezone, defaultView: defaultView as any, theme });
      setNotice("Account preferences saved securely.");
    } catch {
      setError("Preferences could not be saved. Please try again.");
    }
  };

  const exportAccountData = async () => {
    setError(null);
    try {
      const result = await exportQuery.refetch();
      if (!result.data) throw new Error("No export data returned");
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `raito-fx-account-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice("Your account export is ready and downloaded locally.");
    } catch {
      setError("The account export could not be generated.");
    }
  };

  const deleteAccountData = async () => {
    if (!canDeleteAccount(confirmation)) return;
    setError(null);
    try {
      await deleteAccount.mutateAsync({ confirmation: "DELETE MY ACCOUNT" });
      APP_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
      window.location.assign("/");
    } catch (deleteError: any) {
      setError(deleteError?.message || "The account could not be deleted. No data was removed.");
    }
  };

  if (profileQuery.isLoading) return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-sm text-slate-400">Loading account settings…</div>;
  if (profileQuery.error) return <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300" role="alert">Account settings are available only after secure sign-in.</div>;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-5" aria-labelledby="account-settings-title">
      <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-slate-900 to-slate-950 p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-amber-400"><ShieldCheck className="h-4 w-4" /> Protected account center</p>
            <h1 id="account-settings-title" className="mt-2 text-2xl font-black text-white">Account settings & privacy</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">{profileSummary}. Identity and credentials remain managed by the secure identity provider.</p>
            <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500">Workspace clock: <span className="text-cyan-300">{formatAccountClock(clockNow, timezone)}</span></p>
          </div>
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Session protected</span>
        </div>
      </div>

      {notice && <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-300" role="status"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300" role="alert">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-sky-500/10 p-2 text-sky-300"><Save className="h-5 w-5" /></div><div><h2 className="font-bold text-white">Profile & preferences</h2><p className="text-xs text-slate-500">Customize your private workspace.</p></div></div>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={160} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-amber-500/60" /></label>
            <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">Timezone<input value={timezone} onChange={(e) => setTimezone(e.target.value)} maxLength={64} placeholder="UTC" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-amber-500/60" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">Default workspace<select value={defaultView} onChange={(e) => setDefaultView(e.target.value)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-amber-500/60"><option value="list">All Assets</option><option value="auto_signals">Auto Signal Analyze</option><option value="signals">Signal Analyze</option><option value="all_in_one">All-in-One AI Engine</option><option value="agent">RAITO Agent</option><option value="news">Economic Calendar &amp; News</option><option value="markets">Markets &amp; Chart</option><option value="pulse">Market Pulse</option><option value="research">Research Library</option><option value="alerts">Price Alerts</option><option value="journal">Trade Journal</option><option value="analytics">Portfolio Analytics</option></select></label>
              <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">Theme<select value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-amber-500/60"><option value="dark">{accountSettingsLabel("dark")}</option><option value="light">{accountSettingsLabel("light")}</option><option value="system">{accountSettingsLabel("system")}</option></select></label>
            </div>
            <button onClick={() => void savePreferences()} disabled={updateProfile.isPending} className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-xs font-black text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"><Save className="h-4 w-4" />{updateProfile.isPending ? "Saving…" : "Save preferences"}</button>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6"><div className="mb-3 flex items-center gap-3"><div className="rounded-xl bg-amber-500/10 p-2 text-amber-300"><KeyRound className="h-5 w-5" /></div><div><h2 className="font-bold text-white">Passwordless recovery</h2><p className="text-xs text-slate-500">Your identity provider handles access recovery.</p></div></div><p className="text-sm leading-6 text-slate-400">If you lose access, continue through the secure account portal and use its email, passkey, or recovery options. Raito-FX Pro never stores a separate password.</p><button onClick={() => { try { startLogin(); } catch { setError("The secure recovery portal could not be opened."); } }} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 text-xs font-bold text-white transition hover:border-amber-500/50"><KeyRound className="h-4 w-4 text-amber-400" /> Open secure recovery portal</button></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6"><div className="mb-3 flex items-center gap-3"><div className="rounded-xl bg-sky-500/10 p-2 text-sky-300"><Download className="h-5 w-5" /></div><div><h2 className="font-bold text-white">Export my data</h2><p className="text-xs text-slate-500">Download a portable JSON copy.</p></div></div><p className="text-sm leading-6 text-slate-400">The export includes your profile preferences, portfolio, paper trades, journal, alerts, and Telegram delivery records.</p><button onClick={() => void exportAccountData()} disabled={exportQuery.isFetching} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 text-xs font-bold text-white transition hover:border-sky-500/50 disabled:opacity-50"><Download className="h-4 w-4 text-sky-300" />{exportQuery.isFetching ? "Preparing export…" : "Download account export"}</button></div></div>
      </div>

      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 sm:p-6"><div className="flex items-start gap-3"><div className="rounded-xl bg-rose-500/10 p-2 text-rose-300"><AlertTriangle className="h-5 w-5" /></div><div className="min-w-0"><h2 className="font-bold text-white">Delete account and data</h2><p className="mt-1 text-sm leading-6 text-slate-400">This permanently removes your profile, portfolio, journal, paper trades, price alerts, Telegram settings, and delivery history. The action cannot be undone.</p><label className="mt-4 flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-300">Type DELETE MY ACCOUNT to confirm<input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="max-w-md rounded-xl border border-rose-500/30 bg-slate-950 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-rose-400" /></label><button onClick={() => void deleteAccountData()} disabled={!canDeleteAccount(confirmation) || deleteAccount.isPending} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 text-xs font-black text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" />{deleteAccount.isPending ? "Deleting securely…" : "Delete account permanently"}</button></div></div></div>
    </section>
  );
}
