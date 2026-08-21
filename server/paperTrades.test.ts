import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => {
  let nextId = 1;
  const rows: any[] = [];
  return {
    listPortfolioHoldings: vi.fn(async () => []),
    upsertPortfolioHolding: vi.fn(async () => []),
    listTradeJournalEntries: vi.fn(async () => []),
    createTradeJournalEntry: vi.fn(async () => []),
    listPriceAlerts: vi.fn(async () => []),
    createPriceAlert: vi.fn(async () => []),
    listPaperTrades: vi.fn(async (userId: number) => rows.filter((row) => row.userId === userId)),
    summarizePaperTrades: vi.fn(async (userId: number) => ({ total: rows.filter((row) => row.userId === userId).length, open: rows.filter((row) => row.userId === userId && row.status === "OPEN").length, closed: 0, wins: 0, losses: 0, winRate: 0, totalPnlPercent: 0, averagePnlPercent: 0 })),
    createPaperTrade: vi.fn(async (userId: number, input: any) => { rows.push({ id: nextId++, userId, ...input, status: "OPEN" }); return rows.filter((row) => row.userId === userId); }),
    closePaperTrade: vi.fn(async (userId: number, tradeId: number, input: any) => { const row = rows.find((candidate) => candidate.id === tradeId && candidate.userId === userId); if (row) Object.assign(row, input, { closedAt: new Date() }); return rows.filter((candidate) => candidate.userId === userId); }),
  };
});

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

const userA = { id: 7, openId: "paper-a", name: "Paper A", email: "a@example.com", loginMethod: "test", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const userB = { id: 8, openId: "paper-b", name: "Paper B", email: "b@example.com", loginMethod: "test", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("paper-trade mutation ownership", () => {
  it("opens for user A and leaves the record open when user B tries to close it", async () => {
    const callerA = appRouter.createCaller(context(userA));
    const callerB = appRouter.createCaller(context(userB));
    await callerA.paperTrades.open({ symbol: "BTCUSDT", direction: "BUY", strategy: "Market Watch", entryPrice: 100, stopLoss: 95, takeProfit: 110, size: 1 });
    await callerB.paperTrades.close({ tradeId: 1, status: "TARGET_HIT", closePrice: 110, pnlPercent: 10, pnlAmount: 10 });
    const records = await callerA.paperTrades.list();
    expect(records).toHaveLength(1);
    expect(records[0].status).toBe("OPEN");
  });

  it("rejects unauthenticated access and invalid setup input", async () => {
    const anonymous = appRouter.createCaller(context(null));
    await expect(anonymous.paperTrades.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const callerA = appRouter.createCaller(context(userA));
    await expect(callerA.paperTrades.open({ symbol: "", direction: "BUY", strategy: "Test", entryPrice: 100, stopLoss: 99, takeProfit: 102, size: 1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
