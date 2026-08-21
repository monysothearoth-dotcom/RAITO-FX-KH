import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import type { TrpcContext } from "./_core/context";

const authenticatedUser = { id: 21, openId: "boundary-user", name: "Boundary User", email: "boundary@example.com", loginMethod: "oauth", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

vi.mock("./_core/sdk", () => ({
  sdk: {
    authenticateRequest: vi.fn(async (req: any) => req.headers.cookie === "session=valid" ? authenticatedUser : null),
  },
}));

function responseFor(request: any) {
  return {
    clearCookie: (_name: string) => { request.headers.cookie = ""; },
  } as TrpcContext["res"];
}

describe("logout request authentication boundary", () => {
  it("clears the cookie and the next context is unauthenticated", async () => {
    const request = { protocol: "https", headers: { cookie: "session=valid" } } as TrpcContext["req"];
    const firstContext = await createContext({ req: request, res: responseFor(request) });
    expect(firstContext.user?.openId).toBe("boundary-user");

    await appRouter.createCaller(firstContext).auth.logout();

    const nextContext = await createContext({ req: request, res: responseFor(request) });
    expect(nextContext.user).toBeNull();
    await expect(appRouter.createCaller(nextContext).paperTrades.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

