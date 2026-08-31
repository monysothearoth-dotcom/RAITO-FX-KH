import { describe, expect, it, vi } from "vitest";
import { encodeOAuthState, OAUTH_STATE_COOKIE } from "../shared/const";

const { upsertUser, exchangeCodeForToken, getUserInfo, createSessionToken } = vi.hoisted(() => ({
  upsertUser: vi.fn(async () => undefined),
  exchangeCodeForToken: vi.fn(async () => ({ accessToken: "access-token" })),
  getUserInfo: vi.fn(async () => ({ openId: "new-oauth-user", name: "New Trader", email: "new@example.com", loginMethod: "google" })),
  createSessionToken: vi.fn(async () => "session-token"),
}));

vi.mock("./db", () => ({ upsertUser }));
vi.mock("./_core/sdk", () => ({ sdk: { exchangeCodeForToken, getUserInfo, createSessionToken } }));

import { registerOAuthRoutes } from "./_core/oauth";

describe("first-time OAuth account creation", () => {
  it("upserts the new user and redirects into the authenticated app", async () => {
    let callback: ((req: any, res: any) => Promise<void>) | undefined;
    const app = { get: vi.fn((_path: string, handler: (req: any, res: any) => Promise<void>) => { callback = handler; }) } as any;
    registerOAuthRoutes(app);

    const state = encodeOAuthState({ redirectUri: "https://example.com/api/oauth/callback", nonce: "nonce-1" });
    const response = {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
      redirect: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await callback?.({ query: { code: "oauth-code", state }, headers: { cookie: `${OAUTH_STATE_COOKIE}=nonce-1` } }, response);

    expect(upsertUser).toHaveBeenCalledWith(expect.objectContaining({ openId: "new-oauth-user", name: "New Trader", email: "new@example.com", loginMethod: "google", lastSignedIn: expect.any(Date) }));
    expect(response.cookie).toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(302, "/");
  });
});

