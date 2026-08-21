import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";

vi.mock("./db", () => ({
  listPortfolioHoldings: vi.fn(async () => []),
  upsertPortfolioHolding: vi.fn(async () => []),
  listTradeJournalEntries: vi.fn(async () => []),
  createTradeJournalEntry: vi.fn(async () => []),
  listPriceAlerts: vi.fn(async () => []),
  createPriceAlert: vi.fn(async () => []),
  listPaperTrades: vi.fn(async () => []),
  summarizePaperTrades: vi.fn(async () => ({ total: 0, open: 0, closed: 0, wins: 0, losses: 0, winRate: 0, totalPnlPercent: 0, averagePnlPercent: 0 })),
  createPaperTrade: vi.fn(async () => []),
  closePaperTrade: vi.fn(async () => []),
  getTelegramNewsSettings: vi.fn(async () => ({ userId: 1, isEnabled: 1, highImpactAlertsEnabled: 1, highImpactLeadMinutes: 15, highImpactInstruments: "XAUUSD,EURUSD", scheduleCronTaskUid: "active-telegram-task", lastError: null, lastSuccessAt: new Date("2026-08-18T12:26:20Z") })),
  enableTelegramNewsSettings: vi.fn(async () => undefined),
  disableTelegramNewsSettings: vi.fn(async () => undefined),
  updateTelegramHighImpactSettings: vi.fn(async (_userId: number, input: unknown) => ({ userId: 1, isEnabled: 1, ...(input as object) })),
  saveTelegramScheduleTask: vi.fn(async () => undefined),
}));

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("authenticated Telegram alert status", () => {
  it("returns the enabled owner setting used by the dashboard to render the pause control", async () => {
    const owner = { id: 1, openId: ENV.ownerOpenId, name: "Owner", email: "owner@example.com", loginMethod: "test", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
    const result = await appRouter.createCaller(context(owner)).telegramNews.status();

    expect(result).toMatchObject({ isEnabled: 1, highImpactAlertsEnabled: 1, highImpactLeadMinutes: 15, highImpactInstruments: "XAUUSD,EURUSD", scheduleCronTaskUid: "active-telegram-task", lastError: null });
  });

  it("allows only the owner to update high-impact alert rules", async () => {
    const owner = { id: 1, openId: ENV.ownerOpenId, name: "Owner", email: "owner@example.com", loginMethod: "test", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
    const result = await appRouter.createCaller(context(owner)).telegramNews.updateHighImpact({ enabled: true, leadMinutes: 15, instruments: ["XAUUSD", "EURUSD"] });
    expect(result).toMatchObject({ enabled: true, leadMinutes: 15, instruments: ["XAUUSD", "EURUSD"] });

    const other = { ...owner, openId: "other-user" };
    await expect(appRouter.createCaller(context(other)).telegramNews.updateHighImpact({ enabled: true, leadMinutes: 15, instruments: ["XAUUSD"] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
