import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => {
  const rows = [
    { id: 1, userId: 11, symbol: "BTCUSDT", status: "OPEN" },
    { id: 2, userId: 12, symbol: "EURUSD", status: "OPEN" },
  ];
  return {
    listPaperTrades: vi.fn(async (userId: number) => rows.filter((row) => row.userId === userId)),
    summarizePaperTrades: vi.fn(async (userId: number) => ({ total: rows.filter((row) => row.userId === userId).length, open: rows.filter((row) => row.userId === userId).length, closed: 0, wins: 0, losses: 0, winRate: 0, totalPnlPercent: 0, averagePnlPercent: 0 })),
  };
});

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

const userA = { id: 11, openId: "account-a", name: "Account A", email: "a@example.com", loginMethod: "oauth", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const userB = { id: 12, openId: "account-b", name: "Account B", email: "b@example.com", loginMethod: "oauth", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("authenticated account data ownership", () => {
  it("returns only the signed-in user’s records and rejects anonymous access", async () => {
    const recordsA = await appRouter.createCaller(context(userA)).paperTrades.list();
    const recordsB = await appRouter.createCaller(context(userB)).paperTrades.list();
    expect(recordsA.map((record) => record.symbol)).toEqual(["BTCUSDT"]);
    expect(recordsB.map((record) => record.symbol)).toEqual(["EURUSD"]);
    await expect(appRouter.createCaller(context(null)).paperTrades.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

