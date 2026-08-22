/** @vitest-environment jsdom */
import React, { useState } from "react";
import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AccountPreferenceRuntime, AuthStatus, dashboardNavigationOrder, getAccountPreferredTab, getInitialDashboardTab, resolveAccountTheme, ResponsiveHeaderNav, responsiveHeaderClassName, responsiveHeaderNavClassName, type DashboardTab } from "./App";

describe("responsive dashboard view routing", () => {
  it("opens every supported dashboard view from its query parameter", () => {
    const views = ["markets", "pulse", "signals", "all_in_one", "agent", "news", "research", "list", "alerts", "journal", "analytics", "account"];
    for (const view of views) expect(getInitialDashboardTab(view)).toBe(view);
  });

  it("promotes All Assets first and keeps the requested analysis tools adjacent", () => {
    expect(dashboardNavigationOrder.slice(0, 7)).toEqual(["list", "markets", "auto_signals", "signals", "all_in_one", "agent", "news"]);
    expect(dashboardNavigationOrder.slice(7)).toEqual(["pulse", "research", "alerts", "journal", "analytics"]);
  });

  it("renders the actual navigation wrapper with responsive overflow classes", () => {
    const html = renderToStaticMarkup(createElement(ResponsiveHeaderNav, null, createElement("button", null, "Markets")));
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("touch-pan-x");
    expect(html).toContain("Markets");
    expect(responsiveHeaderClassName).toContain("min-w-0");
    expect(responsiveHeaderNavClassName).toContain("overflow-x-auto");
  });

  it("renders real account loading, error, authenticated, and unauthenticated states", () => {
    const noop = () => undefined;
    expect(renderToStaticMarkup(createElement(AuthStatus, { loading: true, user: null, onLogin: noop, onSignup: noop, onLogout: noop }))).toContain("Checking account");
    expect(renderToStaticMarkup(createElement(AuthStatus, { loading: false, error: new Error("session"), user: null, onLogin: noop, onSignup: noop, onLogout: noop }))).toContain("Account check unavailable");
    expect(renderToStaticMarkup(createElement(AuthStatus, { loading: false, user: "trader", logoutError: "Sign out failed. Try again.", onLogin: noop, onSignup: noop, onLogout: noop }))).toContain("Sign out failed");
    expect(renderToStaticMarkup(createElement(AuthStatus, { loading: false, user: null, onLogin: noop, onSignup: noop, onLogout: noop }))).toContain("Sign Up");
  });

  it("falls back to the unified workspace for missing or unknown views", () => {
    expect(getInitialDashboardTab(null)).toBe("all_in_one");
    expect(getInitialDashboardTab("unknown")).toBe("all_in_one");
    expect(getInitialDashboardTab("account")).toBe("account");
    expect(getAccountPreferredTab(null, "research")).toBe("research");
    expect(getAccountPreferredTab("news", "research")).toBe("news");
    expect(resolveAccountTheme("light", true)).toBe("light");
    expect(resolveAccountTheme("system", true)).toBe("dark");
  });

  it("applies authenticated persisted default view and theme during startup", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addListener: vi.fn(), removeListener: vi.fn() }));
    function Harness() {
      const [activeTab, setActiveTab] = useState<DashboardTab>("all_in_one");
      return <><AccountPreferenceRuntime requestedView={null} persistedView="research" persistedTheme="light" activeTab={activeTab} setActiveTab={setActiveTab} /><output data-testid="active-tab">{activeTab}</output></>;
    }
    render(<Harness />);
    await waitFor(() => expect(screen.getByTestId("active-tab").textContent).toBe("research"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
