import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("durable trading tools", () => {
  it("rejects unauthenticated portfolio reads", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.portfolio.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.telegramNews.status()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("validates alert input before persistence", async () => {
    const caller = appRouter.createCaller(context({
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));
    await expect(caller.alerts.add({ symbol: "", targetPrice: -1, condition: "ABOVE" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
