import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { canDeleteAccount, formatAccountClock } from "./AccountSettings";

const state = vi.hoisted(() => ({
  profile: { data: { id: 44, openId: "account-ui", name: "Account UI", email: "account@example.com", displayName: "Account UI", timezone: "UTC", defaultView: "all_in_one", theme: "dark" }, isLoading: false, error: null as unknown },
  exportQuery: { refetch: vi.fn(), isFetching: false },
  deleteMutation: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ account: { profile: { invalidate: vi.fn() } } }),
    account: {
      profile: { useQuery: () => state.profile },
      updateProfile: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      exportData: { useQuery: () => state.exportQuery },
      deleteAccount: { useMutation: () => state.deleteMutation },
    },
  },
}));

import AccountSettings from "./AccountSettings";

describe("AccountSettings", () => {
  it("renders recovery, profile, export, and privacy controls from the real component", () => {
    const html = renderToStaticMarkup(createElement(AccountSettings));
    expect(html).toContain("Account settings &amp; privacy");
    expect(html).toContain("Passwordless recovery");
    expect(html).toContain("Open secure recovery portal");
    expect(html).toContain("Download account export");
    expect(html).toContain("DELETE MY ACCOUNT");
    expect(html).toContain("disabled");
  });

  it("renders loading and error states and action-pending labels", () => {
    state.profile = { data: undefined, isLoading: true, error: null };
    expect(renderToStaticMarkup(createElement(AccountSettings))).toContain("Loading account settings");
    state.profile = { data: undefined, isLoading: false, error: new Error("unauthorized") };
    expect(renderToStaticMarkup(createElement(AccountSettings))).toContain("available only after secure sign-in");
    state.profile = { data: { id: 44, openId: "account-ui", name: "Account UI", email: "account@example.com", displayName: "Account UI", timezone: "UTC", defaultView: "all_in_one", theme: "dark" }, isLoading: false, error: null };
    state.exportQuery = { refetch: vi.fn(), isFetching: true };
    expect(renderToStaticMarkup(createElement(AccountSettings))).toContain("Preparing export");
    state.exportQuery = { refetch: vi.fn(), isFetching: false };
  });

  it("requires exact delete confirmation and formats timezone-aware time", () => {
    expect(canDeleteAccount("DELETE")).toBe(false);
    expect(canDeleteAccount("DELETE MY ACCOUNT")).toBe(true);
    expect(formatAccountClock(new Date("2026-01-01T00:00:00Z"), "UTC")).not.toBe(formatAccountClock(new Date("2026-01-01T00:00:00Z"), "Asia/Bangkok"));
  });
});
