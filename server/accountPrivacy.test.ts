import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const { getUserById, updateUserProfile, getUserAccountExport, getTelegramNewsSettings, deleteUserAccount, updateHeartbeatJob } = vi.hoisted(() => ({
  getUserById: vi.fn(async (userId: number) => ({ id: userId, openId: `user-${userId}`, name: "OAuth User", displayName: "Workspace User", email: "user@example.com", timezone: "UTC", defaultView: "all_in_one", theme: "dark", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() })),
  updateUserProfile: vi.fn(async (userId: number, input: unknown) => ({ id: userId, ...input })),
  getUserAccountExport: vi.fn(async (userId: number) => ({ exportedAt: new Date().toISOString(), user: { id: userId }, portfolio: [], journal: [], paperTrades: [], alerts: [], telegramSettings: [], telegramDeliveries: [] })),
  getTelegramNewsSettings: vi.fn(async () => undefined),
  deleteUserAccount: vi.fn(async () => ({ deleted: true as const })),
  updateHeartbeatJob: vi.fn(async () => undefined),
}));

vi.mock("./db", () => ({ getUserById, updateUserProfile, getUserAccountExport, getTelegramNewsSettings, deleteUserAccount }));
vi.mock("./_core/heartbeat", () => ({ updateHeartbeatJob, createHeartbeatJob: vi.fn() }));

function context(user: TrpcContext["user"], res: TrpcContext["res"] = { clearCookie: vi.fn() } as TrpcContext["res"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res };
}

const user = { id: 33, openId: "privacy-user", name: "Privacy User", email: "privacy@example.com", loginMethod: "oauth", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("account privacy procedures", () => {
  it("keeps profile, export, and delete operations authenticated and user-scoped", async () => {
    const response = { clearCookie: vi.fn() } as TrpcContext["res"];
    const caller = appRouter.createCaller(context(user, response));
    await expect(caller.account.profile()).resolves.toMatchObject({ id: 33 });
    await expect(caller.account.updateProfile({ displayName: "Private Workspace", timezone: "Asia/Bangkok", defaultView: "research", theme: "dark" })).resolves.toMatchObject({ id: 33, displayName: "Private Workspace" });
    await expect(caller.account.exportData()).resolves.toMatchObject({ user: { id: 33 }, paperTrades: [] });
    await expect(caller.account.deleteAccount({ confirmation: "DELETE MY ACCOUNT" })).resolves.toEqual({ deleted: true });
    expect(deleteUserAccount).toHaveBeenCalledWith(33);
    expect(response.clearCookie).toHaveBeenCalled();
  });

  it("aborts deletion when the linked scheduler cannot be disabled", async () => {
    getTelegramNewsSettings.mockResolvedValueOnce({ scheduleCronTaskUid: "task-privacy" } as any);
    updateHeartbeatJob.mockRejectedValueOnce(new Error("scheduler unavailable"));
    deleteUserAccount.mockClear();
    await expect(appRouter.createCaller(context(user)).account.deleteAccount({ confirmation: "DELETE MY ACCOUNT" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(deleteUserAccount).not.toHaveBeenCalled();
  });

  it("rejects anonymous access and incorrect destructive confirmation", async () => {
    await expect(appRouter.createCaller(context(null)).account.profile()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const caller = appRouter.createCaller(context(user));
    await expect(caller.account.deleteAccount({ confirmation: "DELETE" as "DELETE MY ACCOUNT" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

