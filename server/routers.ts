import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookie } from "cookie";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { systemRouter } from "./_core/systemRouter";
import { canManageTelegramNewsAlerts, getTelegramHealthStatus } from "./telegramNews";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { closePaperTrade, createNewsEffectTracking, createPaperTrade, createPriceAlert, createTradeJournalEntry, deleteUserAccount, disableAutoSignalSettings, disableTelegramNewsSettings, enableAutoSignalSettings, enableTelegramNewsSettings, getAutoSignalDeliveryHealth, getAutoSignalSettings, getTelegramNewsSettings, getUserAccountExport, getUserById, getUserNewsEffectTrackingSummary, listAutoSignals, listNewsEffectTracking, listPaperTrades, listPortfolioHoldings, listPriceAlerts, listTradeJournalEntries, saveAutoSignalScheduleTask, saveTelegramScheduleTask, summarizePaperTrades, updateAutoSignalThresholds, updateNewsEffectTracking, updateTelegramHighImpactSettings, updateUserProfile, upsertPortfolioHolding } from "./db";
import { comparePredictedEffect, fetchTrackingPrice, movementPercent, newsEffectFingerprint, classifyActualEffect } from "./newsEffectTracking";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  portfolio: router({
    list: protectedProcedure.query(({ ctx }) => listPortfolioHoldings(ctx.user.id)),
    add: protectedProcedure.input(z.object({ symbol: z.string().min(1).max(64), quantity: z.number().positive(), averagePrice: z.number().nonnegative() })).mutation(({ ctx, input }) => upsertPortfolioHolding(ctx.user.id, input)),
  }),
  paperTrades: router({
    list: protectedProcedure.query(({ ctx }) => listPaperTrades(ctx.user.id)),
    summary: protectedProcedure.query(({ ctx }) => summarizePaperTrades(ctx.user.id)),
    open: protectedProcedure.input(z.object({ symbol: z.string().min(1).max(64), direction: z.enum(["BUY", "SELL"]), strategy: z.string().min(1).max(128), provider: z.string().max(64).optional(), setupScore: z.number().min(0).max(100).optional(), entryPrice: z.number().positive(), stopLoss: z.number().positive(), takeProfit: z.number().positive(), size: z.number().positive().default(1), rationale: z.string().optional() })).mutation(({ ctx, input }) => createPaperTrade(ctx.user.id, input)),
    close: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), status: z.enum(["TARGET_HIT", "STOPPED_OUT", "CLOSED"]), closePrice: z.number().positive(), pnlPercent: z.number(), pnlAmount: z.number().optional() })).mutation(({ ctx, input }) => { const { tradeId, ...closeInput } = input; return closePaperTrade(ctx.user.id, tradeId, closeInput); }),
  }),
  journal: router({
    list: protectedProcedure.query(({ ctx }) => listTradeJournalEntries(ctx.user.id)),
    add: protectedProcedure.input(z.object({ symbol: z.string().min(1).max(64), direction: z.enum(["BUY", "SELL"]), strategy: z.string().min(1).max(128), entryPrice: z.number().nonnegative(), exitPrice: z.number().nonnegative().optional(), size: z.number().positive(), pnl: z.number().optional(), status: z.string().min(1).max(32), notes: z.string().optional() })).mutation(({ ctx, input }) => createTradeJournalEntry(ctx.user.id, input)),
  }),
  alerts: router({
    list: protectedProcedure.query(({ ctx }) => listPriceAlerts(ctx.user.id)),
    add: protectedProcedure.input(z.object({ symbol: z.string().min(1).max(64), targetPrice: z.number().nonnegative(), condition: z.enum(["ABOVE", "BELOW"]) })).mutation(({ ctx, input }) => createPriceAlert(ctx.user.id, input)),
  }),
  tracking: router({
    list: protectedProcedure.query(async ({ ctx }) => ({ rows: await listNewsEffectTracking(ctx.user.id), summary: await getUserNewsEffectTrackingSummary(ctx.user.id) })),
    track: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(512), url: z.string().url().max(1024).optional(), symbol: z.string().trim().regex(/^[A-Z0-9:]{3,32}$/), predictedEffect: z.enum(["BUY", "SELL", "NORMAL"]), evaluationWindowMinutes: z.number().int().min(15).max(1440).default(60) })).mutation(async ({ ctx, input }) => {
      let baselinePrice: number;
      try { baselinePrice = await fetchTrackingPrice(input.symbol); } catch (error) { throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "A live baseline price is unavailable." }); }
      const fingerprint = newsEffectFingerprint(input);
      return createNewsEffectTracking(ctx.user.id, { ...input, fingerprint, baselinePrice, symbol: input.symbol.toUpperCase() });
    }),
    evaluate: protectedProcedure.mutation(async ({ ctx }) => {
      const rows = await listNewsEffectTracking(ctx.user.id);
      for (const row of rows) {
        if (row.outcome !== "PENDING") continue;
        if (Date.now() - new Date(row.baselineAt).getTime() < row.evaluationWindowMinutes * 60_000) continue;
        try {
          const currentPrice = await fetchTrackingPrice(row.symbol);
          const move = movementPercent(row.baselinePrice, currentPrice);
          const actualEffect = classifyActualEffect(move);
          await updateNewsEffectTracking(ctx.user.id, row.id, { currentPrice, movementPercent: move, actualEffect, outcome: comparePredictedEffect(row.predictedEffect, actualEffect), evaluatedAt: new Date() });
        } catch {
          await updateNewsEffectTracking(ctx.user.id, row.id, { outcome: "UNAVAILABLE", evaluatedAt: new Date() });
        }
      }
      return { rows: await listNewsEffectTracking(ctx.user.id), summary: await getUserNewsEffectTrackingSummary(ctx.user.id) };
    }),
  }),
  telegramNews: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      if (!canManageTelegramNewsAlerts(ctx.user.openId, ENV.ownerOpenId)) return undefined;
      const settings = await getTelegramNewsSettings(ctx.user.id);
      return settings ? { ...settings, healthStatus: getTelegramHealthStatus(settings) } : { isEnabled: 0, highImpactAlertsEnabled: 1, highImpactLeadMinutes: 15, highImpactInstruments: "XAUUSD,EURUSD,GBPUSD,USDJPY,AUDUSD,USDCAD,USDCHF,NZDUSD", lastError: null, sourceFailures: null, runCount: 0, successfulRunCount: 0, failedRunCount: 0, consecutiveFailureCount: 0, totalSent: 0, totalSkipped: 0, pendingNotificationType: null, pendingNotificationContent: null, notificationAttemptCount: 0, lastNotificationError: null, lastRunAt: null, lastSuccessAt: null, healthStatus: "disabled" as const };
    }),
    enable: protectedProcedure.mutation(async ({ ctx }) => {
      if (!canManageTelegramNewsAlerts(ctx.user.openId, ENV.ownerOpenId)) throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can manage the configured Telegram destination." });
      if (!ENV.telegramBotToken || !ENV.telegramChatId) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Telegram bot configuration is incomplete." });
      }
      const setting = await enableTelegramNewsSettings(ctx.user.id);
      if (setting?.scheduleCronTaskUid) {
        const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        await updateHeartbeatJob(setting.scheduleCronTaskUid, { enable: true }, session);
        return getTelegramNewsSettings(ctx.user.id);
      }
      const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const job = await createHeartbeatJob({ name: `telegram-news-${ctx.user.id}`, cron: "0 * * * * *", path: "/api/scheduled/telegram-news", payload: {}, description: "Deduplicated Forex and Cryptocurrency Telegram news alerts every 60 seconds." }, session);
      return saveTelegramScheduleTask(ctx.user.id, job.taskUid);
    }),
    disable: protectedProcedure.mutation(async ({ ctx }) => {
      if (!canManageTelegramNewsAlerts(ctx.user.openId, ENV.ownerOpenId)) throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can manage the configured Telegram destination." });
      const setting = await disableTelegramNewsSettings(ctx.user.id);
      if (setting?.scheduleCronTaskUid) {
        const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        await updateHeartbeatJob(setting.scheduleCronTaskUid, { enable: false }, session);
      }
      return getTelegramNewsSettings(ctx.user.id);
    }),
    updateHighImpact: protectedProcedure.input(z.object({ enabled: z.boolean(), leadMinutes: z.number().int().min(1).max(60), instruments: z.array(z.string().trim().regex(/^[A-Z0-9]{3,12}$/)).min(1).max(16) })).mutation(async ({ ctx, input }) => {
      if (!canManageTelegramNewsAlerts(ctx.user.openId, ENV.ownerOpenId)) throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can manage high-impact Telegram alerts." });
      return updateTelegramHighImpactSettings(ctx.user.id, { ...input, instruments: Array.from(new Set(input.instruments.map((item) => item.toUpperCase()))) });
    }),
  }),

  autoSignals: router({
    list: publicProcedure.query(() => listAutoSignals()),
    status: protectedProcedure.query(async ({ ctx }) => {
      if (!canManageTelegramNewsAlerts(ctx.user.openId, ENV.ownerOpenId)) return undefined;
      return (await getAutoSignalSettings(ctx.user.id)) || { isEnabled: 0, minConfidence: 78, minScore: 82, minRiskReward: 1.8, lastRunAt: null, lastError: null, scheduleCronTaskUid: null };
    }),
    deliveryHealth: protectedProcedure.query(async ({ ctx }) => {
      if (!canManageTelegramNewsAlerts(ctx.user.openId, ENV.ownerOpenId)) throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can inspect Auto Signal delivery health." });
      return getAutoSignalDeliveryHealth(ctx.user.id);
    }),
    updateThresholds: protectedProcedure.input(z.object({ minConfidence: z.number().int().min(60).max(95), minScore: z.number().int().min(60).max(95), minRiskReward: z.number().min(1.1).max(4) })).mutation(async ({ ctx, input }) => {
      if (!canManageTelegramNewsAlerts(ctx.user.openId, ENV.ownerOpenId)) throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can tune Auto Signal Analyze." });
      return updateAutoSignalThresholds(ctx.user.id, input);
    }),
    enable: protectedProcedure.mutation(async ({ ctx }) => {
      if (!canManageTelegramNewsAlerts(ctx.user.openId, ENV.ownerOpenId)) throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can enable Auto Signal Analyze." });
      if (!ENV.autoSignalTelegramBotToken || !ENV.autoSignalTelegramChatId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The dedicated Auto Signal Telegram bot configuration is incomplete." });
      const settings = await enableAutoSignalSettings(ctx.user.id);
      const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      if (settings?.scheduleCronTaskUid) {
        await updateHeartbeatJob(settings.scheduleCronTaskUid, { enable: true }, session);
        return getAutoSignalSettings(ctx.user.id);
      }
      const job = await createHeartbeatJob({ name: `auto-signal-monitor-${ctx.user.id}`, cron: "0 * * * * *", path: "/api/scheduled/auto-signal-monitor", payload: {}, description: "Persistent XAU/USD and BTC/USD Auto Signal Analyze monitoring every 60 seconds." }, session);
      return saveAutoSignalScheduleTask(ctx.user.id, job.taskUid);
    }),
    disable: protectedProcedure.mutation(async ({ ctx }) => {
      if (!canManageTelegramNewsAlerts(ctx.user.openId, ENV.ownerOpenId)) throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can disable Auto Signal Analyze." });
      const settings = await disableAutoSignalSettings(ctx.user.id);
      if (settings?.scheduleCronTaskUid) {
        const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        await updateHeartbeatJob(settings.scheduleCronTaskUid, { enable: false }, session);
      }
      return getAutoSignalSettings(ctx.user.id);
    }),
  }),

  account: router({
    profile: protectedProcedure.query(({ ctx }) => getUserById(ctx.user.id)),
    updateProfile: protectedProcedure.input(z.object({ displayName: z.string().trim().min(1).max(160).nullable().optional(), timezone: z.string().trim().min(1).max(64).optional(), defaultView: z.enum(["markets", "auto_signals", "pulse", "signals", "all_in_one", "agent", "news", "research", "list", "alerts", "journal", "analytics"]).optional(), theme: z.enum(["dark", "light", "system"]).optional() })).mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)),
    exportData: protectedProcedure.query(async ({ ctx }) => {
      const data = await getUserAccountExport(ctx.user.id);
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Account record was not found." });
      return data;
    }),
    deleteAccount: protectedProcedure.input(z.object({ confirmation: z.literal("DELETE MY ACCOUNT") })).mutation(async ({ ctx, input }) => {
      const settings = await getTelegramNewsSettings(ctx.user.id);
      if (settings?.scheduleCronTaskUid) {
        const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        try {
          await updateHeartbeatJob(settings.scheduleCronTaskUid, { enable: false }, session);
        } catch {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The account alert schedule could not be disabled. No data was deleted." });
        }
      }
      await deleteUserAccount(ctx.user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { deleted: true as const };
    }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
