import { marketEffectLabel } from "./highImpactNews";

export type TelegramNewsItem = {
  title: string;
  khmerTitle?: string;
  url?: string;
  source?: string;
  category: "forex" | "crypto";
  timestamp: number;
  relatedCurrency?: string;
  effectAnalysis?: { affectedInstruments: string[]; direction: "BUY" | "SELL" | "MIXED"; expectedEffect: string; impact: "high" | "medium" | "low"; risk: string; confidence?: number; invalidation?: string };
};

export function telegramNewsFingerprint(item: TelegramNewsItem): string {
  return `${item.category}|${item.url || item.title}|${item.relatedCurrency || ""}`.toLowerCase().slice(0, 191);
}

export function canManageTelegramNewsAlerts(requesterOpenId: string, ownerOpenId: string): boolean {
  return Boolean(ownerOpenId) && requesterOpenId === ownerOpenId;
}

export type TelegramHealthStatus = "healthy" | "degraded" | "outage" | "disabled";

export function getTelegramHealthStatus(settings?: { isEnabled?: number; outageActive?: number; consecutiveFailureCount?: number; lastError?: string | null; sourceFailures?: string | null }): TelegramHealthStatus {
  if (!settings?.isEnabled) return "disabled";
  if (Number(settings.outageActive || 0) || Number(settings.consecutiveFailureCount || 0) >= 3) return "outage";
  if (settings.lastError || settings.sourceFailures) return "degraded";
  return "healthy";
}

export function selectUndeliveredTelegramNews(items: TelegramNewsItem[], deliveredFingerprints: Set<string>, limit = 12): TelegramNewsItem[] {
  return items.filter((item) => !deliveredFingerprints.has(telegramNewsFingerprint(item))).slice(0, limit);
}

export function formatTelegramNewsMessage(items: TelegramNewsItem[]): string {
  const blocks = items.map((item) => {
    const tag = item.category === "crypto" ? "CRYPTO" : "FOREX";
    const asset = item.relatedCurrency ? ` · ${item.relatedCurrency.toUpperCase()}` : "";
    const lines = [
      `[${tag}${asset}]`,
      item.khmerTitle ? `🇰🇭 ${item.khmerTitle}` : undefined,
      `🇬🇧 ${item.title}`,
      item.effectAnalysis ? `Effect: ${marketEffectLabel(item.effectAnalysis.direction)}` : undefined,
      item.effectAnalysis ? `Why: ${item.effectAnalysis.expectedEffect}` : undefined,
      item.source ? `Source: ${item.source}` : undefined,
      item.url ? `Link: ${item.url}` : undefined,
    ].filter((line): line is string => Boolean(line));
    return lines.join("\n");
  });
  return [
    "Market Live Charts",
    "Forex & Crypto News Brief",
    "━━━━━━━━━━━━━━━━━━━━",
    blocks.join("\n\n━━━━━━━━━━━━━━━━━━━━\n\n"),
  ].join("\n\n").slice(0, 4000);
}

export async function sendTelegramNewsMessage(token: string, chatId: string, text: string): Promise<void> {
  if (!token || !chatId) throw new Error("Telegram credentials are not configured");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json().catch(() => ({})) as { ok?: boolean; description?: string };
  if (!response.ok || !payload.ok) throw new Error(payload.description || `Telegram send failed (${response.status})`);
}

export type TelegramNewsFetchResult = {
  items: TelegramNewsItem[];
  sourceFailures?: string[];
};

export type TelegramRunResult = {
  success: boolean;
  error?: string;
  sent?: number;
  skipped?: number;
  sourceFailures?: string[];
};

export function getTelegramHealthTransition(settings: { outageActive?: number; consecutiveFailureCount?: number } | undefined, result: TelegramRunResult) {
  const sourceFailures = (result.sourceFailures || []).filter(Boolean);
  const unhealthy = !result.success || sourceFailures.length > 0;
  const consecutiveFailureCount = unhealthy ? Number(settings?.consecutiveFailureCount || 0) + 1 : 0;
  const outageStarted = unhealthy && consecutiveFailureCount >= 3 && !Number(settings?.outageActive || 0);
  const recovered = !unhealthy && Boolean(Number(settings?.outageActive || 0));
  return { unhealthy, sourceFailures, consecutiveFailureCount, outageStarted, recovered, error: result.error || (sourceFailures.length ? `Source degradation: ${sourceFailures.join(", ")}` : null) };
}

export function getTelegramNotificationPlan(settings: { pendingNotificationType?: string | null; pendingNotificationContent?: string | null } | undefined, transition: { outageStarted: boolean; recovered: boolean; consecutiveFailureCount: number; error: string | null }) {
  if (transition.recovered) return { type: "recovery", title: "Raito-FX Pro news delivery recovered", content: "Telegram Forex/Crypto news delivery is healthy again. The outage state has cleared and new headlines will continue automatically." };
  if (transition.outageStarted) return { type: "outage", title: "Raito-FX Pro news delivery outage", content: `Telegram news delivery has been unhealthy for ${transition.consecutiveFailureCount} consecutive checks. ${transition.error || "The public news sources or Telegram delivery endpoint are failing."}` };
  if (settings?.pendingNotificationType && settings.pendingNotificationContent) return { type: settings.pendingNotificationType, title: settings.pendingNotificationType === "recovery" ? "Raito-FX Pro news delivery recovered" : "Raito-FX Pro news delivery outage", content: settings.pendingNotificationContent };
  return null;
}

export async function deliverTelegramNewsBatch(input: {
  items: TelegramNewsItem[];
  deliveredFingerprints: Set<string>;
  send: (text: string) => Promise<void>;
  record: (items: TelegramNewsItem[]) => Promise<void>;
  markRun: (result: TelegramRunResult) => Promise<unknown>;
  healthy?: boolean;
  sourceFailures?: string[];
  translate?: (items: TelegramNewsItem[]) => Promise<TelegramNewsItem[]>;
}): Promise<number> {
  const unseen = selectUndeliveredTelegramNews(input.items, input.deliveredFingerprints);
  const skipped = Math.max(0, input.items.length - unseen.length);
  if (!unseen.length) {
    await input.markRun({ success: input.healthy !== false, sent: 0, skipped, sourceFailures: input.sourceFailures });
    return 0;
  }
  try {
    let localized = unseen;
    if (input.translate) {
      try {
        localized = await input.translate(unseen);
      } catch {
        localized = unseen;
      }
    }
    await input.send(formatTelegramNewsMessage(localized));
    await input.record(unseen);
    await input.markRun({ success: input.healthy !== false, sent: unseen.length, skipped, sourceFailures: input.sourceFailures, error: input.healthy === false ? `Source degradation: ${(input.sourceFailures || []).join(", ")}` : undefined });
    return unseen.length;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telegram news delivery failed";
    const failure: TelegramRunResult = { success: false, error: message };
    if (skipped > 0) failure.skipped = skipped;
    if (input.sourceFailures?.length) failure.sourceFailures = input.sourceFailures;
    await input.markRun(failure);
    throw error;
  }
}

export async function runScheduledTelegramDelivery(input: {
  settings?: { userId: number; isEnabled: number };
  fetchNews: () => Promise<TelegramNewsItem[] | TelegramNewsFetchResult>;
  listDelivered: (userId: number) => Promise<Array<{ fingerprint: string }>>;
  send: (text: string) => Promise<void>;
  record: (userId: number, items: TelegramNewsItem[]) => Promise<void>;
  markRun: (userId: number, result: TelegramRunResult) => Promise<unknown>;
  translate?: (items: TelegramNewsItem[]) => Promise<TelegramNewsItem[]>;
}): Promise<{ status: number; body: { ok?: boolean; sent?: number; skipped?: string; degraded?: boolean; error?: string; timestamp?: string } }> {
  if (!input.settings || !input.settings.isEnabled) return { status: 200, body: { ok: true, skipped: "disabled-or-orphan" } };
  try {
    const fetched = await input.fetchNews();
    const allNews = Array.isArray(fetched) ? fetched : fetched.items;
    const sourceFailures = Array.isArray(fetched) ? [] : (fetched.sourceFailures || []);
    if (!allNews.length && sourceFailures.length) {
      const error = `All news sources failed: ${sourceFailures.join(", ")}`;
      await input.markRun(input.settings.userId, { success: false, error, sourceFailures });
      return { status: 502, body: { error, timestamp: new Date().toISOString() } };
    }
    const delivered = await input.listDelivered(input.settings.userId);
    const sent = await deliverTelegramNewsBatch({
      items: allNews,
      deliveredFingerprints: new Set(delivered.map((item) => item.fingerprint)),
      send: input.send,
      record: (items) => input.record(input.settings!.userId, items),
      markRun: (result) => input.markRun(input.settings!.userId, result),
      healthy: sourceFailures.length === 0,
      sourceFailures,
      translate: input.translate,
    });
    return { status: 200, body: { ok: true, sent, degraded: sourceFailures.length > 0 } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telegram news delivery failed";
    return { status: 500, body: { error: message, timestamp: new Date().toISOString() } };
  }
}
