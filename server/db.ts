import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, portfolioHoldings, tradeJournalEntries, priceAlerts, paperTrades, telegramNewsDeliveries, telegramNewsSettings, newsEffectTracking, autoSignalDeliveries, autoSignalSettings, autoSignals } from "../drizzle/schema";
import { ENV } from './_core/env';
import { notifyOwner } from './_core/notification';
import { getTelegramHealthTransition, getTelegramNotificationPlan } from './telegramNews';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
}

export async function updateUserProfile(userId: number, input: { displayName?: string | null; timezone?: string; defaultView?: string; theme?: "dark" | "light" | "system" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(users).set(input).where(eq(users.id, userId));
  return (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
}

export async function createNewsEffectTracking(userId: number, input: Omit<typeof newsEffectTracking.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt" | "outcome" | "currentPrice" | "movementPercent" | "actualEffect" | "evaluatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(newsEffectTracking).values({ userId, ...input, outcome: "PENDING" }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  return listNewsEffectTracking(userId);
}

export async function listNewsEffectTracking(userId: number) {
  const db = await getDb();
  return db ? db.select().from(newsEffectTracking).where(eq(newsEffectTracking.userId, userId)).orderBy(desc(newsEffectTracking.createdAt)).limit(200) : [];
}

export async function updateNewsEffectTracking(userId: number, id: number, input: { currentPrice?: number | null; movementPercent?: number | null; actualEffect?: "BUY" | "SELL" | "NORMAL" | null; outcome: "PENDING" | "CORRECT" | "INCORRECT" | "NEUTRAL" | "UNAVAILABLE"; evaluatedAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(newsEffectTracking).set(input).where(and(eq(newsEffectTracking.id, id), eq(newsEffectTracking.userId, userId)));
  return listNewsEffectTracking(userId);
}

export async function getUserNewsEffectTrackingSummary(userId: number) {
  const rows = await listNewsEffectTracking(userId);
  const resolved = rows.filter((row) => row.outcome !== "PENDING" && row.outcome !== "UNAVAILABLE");
  const correct = rows.filter((row) => row.outcome === "CORRECT").length;
  const incorrect = rows.filter((row) => row.outcome === "INCORRECT").length;
  const neutral = rows.filter((row) => row.outcome === "NEUTRAL").length;
  return { total: rows.length, pending: rows.filter((row) => row.outcome === "PENDING").length, unavailable: rows.filter((row) => row.outcome === "UNAVAILABLE").length, correct, incorrect, neutral, accuracy: resolved.length ? Number(((correct / resolved.length) * 100).toFixed(1)) : 0 };
}

export async function getUserAccountExport(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!user) return undefined;
    const [portfolio, journal, trades, alerts, telegramSettings, telegramDeliveries, newsEffects, signalSettings, signals, signalDeliveries] = await Promise.all([
    db.select().from(portfolioHoldings).where(eq(portfolioHoldings.userId, userId)),
    db.select().from(tradeJournalEntries).where(eq(tradeJournalEntries.userId, userId)),
    db.select().from(paperTrades).where(eq(paperTrades.userId, userId)),
    db.select().from(priceAlerts).where(eq(priceAlerts.userId, userId)),
    db.select().from(telegramNewsSettings).where(eq(telegramNewsSettings.userId, userId)),
    db.select().from(telegramNewsDeliveries).where(eq(telegramNewsDeliveries.userId, userId)),
    db.select().from(newsEffectTracking).where(eq(newsEffectTracking.userId, userId)),
    db.select().from(autoSignalSettings).where(eq(autoSignalSettings.userId, userId)),
    db.select().from(autoSignals).where(eq(autoSignals.userId, userId)),
    db.select().from(autoSignalDeliveries).where(eq(autoSignalDeliveries.userId, userId)),
  ]);
  return { exportedAt: new Date().toISOString(), user: { id: user.id, openId: user.openId, name: user.name, displayName: user.displayName, email: user.email, loginMethod: user.loginMethod, timezone: user.timezone, defaultView: user.defaultView, theme: user.theme, createdAt: user.createdAt, updatedAt: user.updatedAt, lastSignedIn: user.lastSignedIn }, portfolio, journal, paperTrades: trades, alerts, telegramSettings, telegramDeliveries, newsEffects, autoSignalSettings: signalSettings, autoSignals: signals, autoSignalDeliveries: signalDeliveries };
}

export async function deleteUserAccount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.transaction(async (tx) => {
    await tx.delete(autoSignalDeliveries).where(eq(autoSignalDeliveries.userId, userId));
    await tx.delete(autoSignals).where(eq(autoSignals.userId, userId));
    await tx.delete(autoSignalSettings).where(eq(autoSignalSettings.userId, userId));
    await tx.delete(newsEffectTracking).where(eq(newsEffectTracking.userId, userId));
    await tx.delete(telegramNewsDeliveries).where(eq(telegramNewsDeliveries.userId, userId));
    await tx.delete(telegramNewsSettings).where(eq(telegramNewsSettings.userId, userId));
    await tx.delete(priceAlerts).where(eq(priceAlerts.userId, userId));
    await tx.delete(paperTrades).where(eq(paperTrades.userId, userId));
    await tx.delete(tradeJournalEntries).where(eq(tradeJournalEntries.userId, userId));
    await tx.delete(portfolioHoldings).where(eq(portfolioHoldings.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });
  return { deleted: true as const };
}

export async function listPortfolioHoldings(userId: number) {
  const db = await getDb();
  return db ? db.select().from(portfolioHoldings).where(eq(portfolioHoldings.userId, userId)) : [];
}

export async function upsertPortfolioHolding(userId: number, input: { symbol: string; quantity: number; averagePrice: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(portfolioHoldings).values({ userId, ...input });
  return listPortfolioHoldings(userId);
}

export async function listTradeJournalEntries(userId: number) {
  const db = await getDb();
  return db ? db.select().from(tradeJournalEntries).where(eq(tradeJournalEntries.userId, userId)) : [];
}

export async function createTradeJournalEntry(userId: number, input: Omit<typeof tradeJournalEntries.$inferInsert, "id" | "userId" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(tradeJournalEntries).values({ userId, ...input });
  return listTradeJournalEntries(userId);
}

export async function listPaperTrades(userId: number) {
  const db = await getDb();
  return db ? db.select().from(paperTrades).where(eq(paperTrades.userId, userId)) : [];
}

export async function createPaperTrade(userId: number, input: Omit<typeof paperTrades.$inferInsert, "id" | "userId" | "openedAt" | "updatedAt" | "status" | "closedAt" | "closePrice" | "pnlPercent" | "pnlAmount">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(paperTrades).values({ userId, status: "OPEN", ...input });
  return listPaperTrades(userId);
}

export function canClosePaperTrade(tradeOwnerId: number, requesterId: number) {
  return tradeOwnerId === requesterId;
}

export async function closePaperTrade(userId: number, tradeId: number, input: { status: "TARGET_HIT" | "STOPPED_OUT" | "CLOSED"; closePrice: number; pnlPercent: number; pnlAmount?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(paperTrades).set({ ...input, closedAt: new Date() }).where(and(eq(paperTrades.id, tradeId), eq(paperTrades.userId, userId)));
  return listPaperTrades(userId);
}

export async function summarizePaperTrades(userId: number) {
  const trades = await listPaperTrades(userId);
  const closed = trades.filter((trade) => trade.status !== "OPEN" && trade.status !== "CANCELLED");
  const wins = closed.filter((trade) => Number(trade.pnlPercent || 0) > 0);
  const losses = closed.filter((trade) => Number(trade.pnlPercent || 0) < 0);
  const totalPnlPercent = closed.reduce((sum, trade) => sum + Number(trade.pnlPercent || 0), 0);
  return { total: trades.length, open: trades.filter((trade) => trade.status === "OPEN").length, closed: closed.length, wins: wins.length, losses: losses.length, winRate: closed.length ? Number(((wins.length / closed.length) * 100).toFixed(1)) : 0, totalPnlPercent: Number(totalPnlPercent.toFixed(2)), averagePnlPercent: closed.length ? Number((totalPnlPercent / closed.length).toFixed(2)) : 0 };
}

export async function listPriceAlerts(userId: number) {
  const db = await getDb();
  return db ? db.select().from(priceAlerts).where(eq(priceAlerts.userId, userId)) : [];
}

export async function createPriceAlert(userId: number, input: Omit<typeof priceAlerts.$inferInsert, "id" | "userId" | "createdAt" | "isTriggered">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(priceAlerts).values({ userId, isTriggered: 0, ...input });
  return listPriceAlerts(userId);
}

export async function getTelegramNewsSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(telegramNewsSettings).where(eq(telegramNewsSettings.userId, userId)).limit(1))[0];
}

export async function enableTelegramNewsSettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(telegramNewsSettings).values({ userId, isEnabled: 1 }).onDuplicateKeyUpdate({ set: { isEnabled: 1, lastError: null } });
  return getTelegramNewsSettings(userId);
}

export async function disableTelegramNewsSettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(telegramNewsSettings).set({ isEnabled: 0 }).where(eq(telegramNewsSettings.userId, userId));
  return getTelegramNewsSettings(userId);
}

export async function updateTelegramHighImpactSettings(userId: number, input: { enabled: boolean; leadMinutes: number; instruments: string[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const values = {
    userId,
    isEnabled: 0,
    highImpactAlertsEnabled: input.enabled ? 1 : 0,
    highImpactLeadMinutes: Math.max(1, Math.min(60, Math.round(input.leadMinutes))),
    highImpactInstruments: input.instruments.join(",").slice(0, 512),
  };
  await db.insert(telegramNewsSettings).values(values).onDuplicateKeyUpdate({ set: { highImpactAlertsEnabled: values.highImpactAlertsEnabled, highImpactLeadMinutes: values.highImpactLeadMinutes, highImpactInstruments: values.highImpactInstruments } });
  return getTelegramNewsSettings(userId);
}

export async function saveTelegramScheduleTask(userId: number, taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(telegramNewsSettings).set({ scheduleCronTaskUid: taskUid }).where(eq(telegramNewsSettings.userId, userId));
  return getTelegramNewsSettings(userId);
}

export async function findTelegramSettingsByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(telegramNewsSettings).where(eq(telegramNewsSettings.scheduleCronTaskUid, taskUid)).limit(1))[0];
}

export async function listTelegramNewsDeliveries(userId: number) {
  const db = await getDb();
  return db ? db.select().from(telegramNewsDeliveries).where(eq(telegramNewsDeliveries.userId, userId)).limit(500) : [];
}

export async function recordTelegramNewsDeliveries(userId: number, deliveries: Array<{ fingerprint: string; title: string; url?: string; category: "forex" | "crypto"; source?: string }>) {
  const db = await getDb();
  if (!db || !deliveries.length) return;
  for (const delivery of deliveries) {
    await db.insert(telegramNewsDeliveries).values({ userId, ...delivery }).onDuplicateKeyUpdate({ set: { title: delivery.title, url: delivery.url ?? null, source: delivery.source ?? null } });
  }
}

export async function markTelegramNewsRun(userId: number, input: { success: boolean; error?: string | null; sent?: number; skipped?: number; sourceFailures?: string[] }) {
  const db = await getDb();
  if (!db) return { outageStarted: false, recovered: false, consecutiveFailureCount: 0 };
  const current = await getTelegramNewsSettings(userId);
  const transition = getTelegramHealthTransition(current, { ...input, error: input.error ?? undefined });
  const { sourceFailures, unhealthy, consecutiveFailureCount, outageStarted, recovered, error } = transition;
  await db.update(telegramNewsSettings).set({
    lastRunAt: new Date(),
    lastSuccessAt: unhealthy ? undefined : new Date(),
    lastError: error?.slice(0, 512) ?? null,
    runCount: sql`${telegramNewsSettings.runCount} + 1`,
    successfulRunCount: unhealthy ? undefined : sql`${telegramNewsSettings.successfulRunCount} + 1`,
    failedRunCount: unhealthy ? sql`${telegramNewsSettings.failedRunCount} + 1` : undefined,
    consecutiveFailureCount,
    totalSent: sql`${telegramNewsSettings.totalSent} + ${Number(input.sent || 0)}`,
    totalSkipped: sql`${telegramNewsSettings.totalSkipped} + ${Number(input.skipped || 0)}`,
    sourceFailures: sourceFailures.length ? sourceFailures.join(", ").slice(0, 512) : null,
    outageActive: unhealthy ? (outageStarted || Number(current?.outageActive || 0) ? 1 : 0) : 0,
  }).where(eq(telegramNewsSettings.userId, userId));

  const notification = getTelegramNotificationPlan(current, { outageStarted, recovered, consecutiveFailureCount, error });

  if (notification) {
    let delivered = false;
    try {
      delivered = await notifyOwner({ title: notification.title, content: notification.content });
    } catch {
      delivered = false;
    }
    if (delivered) {
      await db.update(telegramNewsSettings).set({ pendingNotificationType: null, pendingNotificationContent: null, notificationAttemptCount: 0, lastNotificationError: null }).where(eq(telegramNewsSettings.userId, userId));
    } else {
      await db.update(telegramNewsSettings).set({ pendingNotificationType: notification.type, pendingNotificationContent: notification.content.slice(0, 1024), notificationAttemptCount: sql`${telegramNewsSettings.notificationAttemptCount} + 1`, lastNotificationError: "Owner notification service unavailable" }).where(eq(telegramNewsSettings.userId, userId));
    }
  }
  return { outageStarted, recovered, consecutiveFailureCount, notificationPending: Boolean(notification) };
}

export async function getAutoSignalSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(autoSignalSettings).where(eq(autoSignalSettings.userId, userId)).limit(1))[0];
}

export async function listEnabledAutoSignalSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autoSignalSettings).where(eq(autoSignalSettings.isEnabled, 1));
}

export async function findAutoSignalSettingsByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(autoSignalSettings).where(eq(autoSignalSettings.scheduleCronTaskUid, taskUid)).limit(1))[0];
}

export async function enableAutoSignalSettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(autoSignalSettings).values({ userId, isEnabled: 1 }).onDuplicateKeyUpdate({ set: { isEnabled: 1, lastError: null } });
  return getAutoSignalSettings(userId);
}

export async function disableAutoSignalSettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(autoSignalSettings).set({ isEnabled: 0 }).where(eq(autoSignalSettings.userId, userId));
  return getAutoSignalSettings(userId);
}

export async function updateAutoSignalThresholds(userId: number, input: { minConfidence: number; minScore: number; minRiskReward: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const values = { userId, isEnabled: 0, minConfidence: Math.round(input.minConfidence), minScore: Math.round(input.minScore), minRiskReward: input.minRiskReward };
  await db.insert(autoSignalSettings).values(values).onDuplicateKeyUpdate({ set: { minConfidence: values.minConfidence, minScore: values.minScore, minRiskReward: values.minRiskReward } });
  return getAutoSignalSettings(userId);
}

export async function saveAutoSignalScheduleTask(userId: number, taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(autoSignalSettings).set({ scheduleCronTaskUid: taskUid }).where(eq(autoSignalSettings.userId, userId));
  return getAutoSignalSettings(userId);
}

export async function markAutoSignalRun(userId: number, error?: string | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(autoSignalSettings).set({ lastRunAt: new Date(), lastError: error?.slice(0, 512) ?? null }).where(eq(autoSignalSettings.userId, userId));
}

export async function markAutoSignalContinuousTick(userId: number) {
  const db = await getDb();
  if (!db) return;
  const current = (await db.select({ continuousLastTickAt: autoSignalSettings.continuousLastTickAt }).from(autoSignalSettings).where(eq(autoSignalSettings.userId, userId)).limit(1))[0];
  const now = new Date();
  const previous = current?.continuousLastTickAt?.getTime();
  await db.update(autoSignalSettings).set({ continuousLastTickAt: now, continuousLastIntervalMs: previous ? now.getTime() - previous : null }).where(eq(autoSignalSettings.userId, userId));
}

export async function listAutoSignals(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(autoSignals).orderBy(desc(autoSignals.openedAt)).limit(120);
  return userId ? db.select().from(autoSignals).where(eq(autoSignals.userId, userId)).orderBy(desc(autoSignals.openedAt)).limit(120) : query;
}

export async function listOpenAutoSignals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autoSignals).where(and(eq(autoSignals.userId, userId), eq(autoSignals.status, "OPEN"))).orderBy(desc(autoSignals.openedAt)).limit(40);
}

export async function createAutoSignal(userId: number, input: Omit<typeof autoSignals.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt" | "openedAt" | "resolvedAt" | "outcomePrice" | "outcomeDetails" | "lastEvaluatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = (await db.select().from(autoSignals).where(and(eq(autoSignals.userId, userId), eq(autoSignals.fingerprint, input.fingerprint))).limit(1))[0];
  if (existing) return { signal: existing, created: false };
  const activeKey = `${userId}:${input.symbol.toUpperCase()}`;
  try {
    await db.insert(autoSignals).values({ userId, ...input, activeKey });
  } catch (error) {
    const active = (await db.select().from(autoSignals).where(eq(autoSignals.activeKey, activeKey)).limit(1))[0];
    if (active) return { signal: active, created: false };
    throw error;
  }
  const signal = (await db.select().from(autoSignals).where(and(eq(autoSignals.userId, userId), eq(autoSignals.fingerprint, input.fingerprint))).limit(1))[0];
  if (!signal) throw new Error("Auto signal was not persisted");
  return { signal, created: true };
}

export async function resolveAutoSignal(userId: number, signalId: number, input: { status: "TP_HIT" | "SL_HIT" | "EXPIRED"; outcomePrice: number; outcomeDetails: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(autoSignals).set({ ...input, activeKey: null, resolvedAt: new Date(), lastEvaluatedAt: new Date() }).where(and(eq(autoSignals.id, signalId), eq(autoSignals.userId, userId), eq(autoSignals.status, "OPEN")));
  return (await db.select().from(autoSignals).where(and(eq(autoSignals.id, signalId), eq(autoSignals.userId, userId))).limit(1))[0];
}

export async function touchAutoSignal(userId: number, signalId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(autoSignals).set({ lastEvaluatedAt: new Date() }).where(and(eq(autoSignals.id, signalId), eq(autoSignals.userId, userId), eq(autoSignals.status, "OPEN")));
}

export async function listPendingAutoSignalDeliveries(userId: number) {
  const [signals, deliveries] = await Promise.all([listAutoSignals(userId), listAutoSignalDeliveries(userId)]);
  const deliveryByKey = new Map(deliveries.map((delivery) => [`${delivery.signalId}:${delivery.deliveryType}`, delivery]));
  return signals.flatMap((signal) => {
    const types: Array<"SIGNAL" | "OUTCOME"> = signal.status === "OPEN" ? ["SIGNAL"] : signal.status === "TP_HIT" || signal.status === "SL_HIT" ? ["SIGNAL", "OUTCOME"] : [];
    return types.filter((type) => {
      const delivery = deliveryByKey.get(`${signal.id}:${type}`);
      return !delivery || delivery.status === "PENDING" || delivery.status === "FAILED";
    }).map((deliveryType) => ({ signal, deliveryType }));
  });
}

export async function listAutoSignalDeliveries(userId: number) {
  const db = await getDb();
  return db ? db.select().from(autoSignalDeliveries).where(eq(autoSignalDeliveries.userId, userId)).orderBy(desc(autoSignalDeliveries.deliveredAt)).limit(500) : [];
}

export async function getAutoSignalDeliveryHealth(userId: number) {
  const [signals, deliveries] = await Promise.all([listAutoSignals(userId), listAutoSignalDeliveries(userId)]);
  const delivered = new Set(deliveries.filter((delivery) => delivery.status === "SENT").map((delivery) => `${delivery.signalId}:${delivery.deliveryType}`));
  const expected = signals.flatMap((signal) => signal.status === "OPEN" ? [`${signal.id}:SIGNAL`] : signal.status === "TP_HIT" || signal.status === "SL_HIT" ? [`${signal.id}:SIGNAL`, `${signal.id}:OUTCOME`] : []);
  return {
    signals: signals.length,
    open: signals.filter((signal) => signal.status === "OPEN").length,
    signalDeliveries: deliveries.filter((delivery) => delivery.deliveryType === "SIGNAL" && delivery.status === "SENT").length,
    outcomeDeliveries: deliveries.filter((delivery) => delivery.deliveryType === "OUTCOME" && delivery.status === "SENT").length,
    pending: expected.filter((key) => !delivered.has(key)).length,
    retrying: deliveries.filter((delivery) => delivery.status === "FAILED" || delivery.status === "PENDING").length,
    dispatching: deliveries.filter((delivery) => delivery.status === "SENDING").length,
    uncertain: deliveries.filter((delivery) => delivery.status === "UNKNOWN").length,
    lastDeliveredAt: deliveries.find((delivery) => delivery.status === "SENT")?.deliveredAt ?? null,
  };
}

export async function claimAutoSignalDelivery(userId: number, signalId: number, deliveryType: "SIGNAL" | "OUTCOME") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const now = new Date();
  const result = await db.execute(sql`
    INSERT INTO auto_signal_deliveries (userId, signalId, deliveryType, status, attemptCount, attemptedAt, lastError)
    VALUES (${userId}, ${signalId}, ${deliveryType}, 'SENDING', 1, ${now}, NULL)
    ON DUPLICATE KEY UPDATE
      status = IF(status IN ('PENDING', 'FAILED'), 'SENDING', status),
      attemptCount = IF(status IN ('PENDING', 'FAILED'), attemptCount + 1, attemptCount),
      attemptedAt = IF(status IN ('PENDING', 'FAILED'), VALUES(attemptedAt), attemptedAt),
      lastError = IF(status IN ('PENDING', 'FAILED'), NULL, lastError)
  `);
  const header = (Array.isArray(result) ? result[0] : result) as { affectedRows?: number };
  return Number(header?.affectedRows || 0) > 0;
}

export async function markAutoSignalDeliverySent(userId: number, signalId: number, deliveryType: "SIGNAL" | "OUTCOME") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(autoSignalDeliveries).set({ status: "SENT", deliveredAt: new Date(), lastError: null }).where(and(eq(autoSignalDeliveries.userId, userId), eq(autoSignalDeliveries.signalId, signalId), eq(autoSignalDeliveries.deliveryType, deliveryType), eq(autoSignalDeliveries.status, "SENDING")));
}

export async function markAutoSignalDeliveryFailed(userId: number, signalId: number, deliveryType: "SIGNAL" | "OUTCOME", error: string, status: "FAILED" | "UNKNOWN" = "FAILED") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(autoSignalDeliveries).set({ status, lastError: error.slice(0, 512) }).where(and(eq(autoSignalDeliveries.userId, userId), eq(autoSignalDeliveries.signalId, signalId), eq(autoSignalDeliveries.deliveryType, deliveryType), eq(autoSignalDeliveries.status, "SENDING")));
}
