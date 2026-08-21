/** @vitest-environment jsdom */
import React, { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: { name: "saved-trader", email: "saved@example.com", openId: "saved-open-id" },
  profile: { defaultView: "research", theme: "light", timezone: "Asia/Bangkok" },
}));

vi.mock("./_core/hooks/useAuth", () => ({ useAuth: () => ({ user: authState.user, loading: false, error: null, logout: vi.fn() }) }));
vi.mock("./lib/trpc", () => ({ trpc: { account: { profile: { useQuery: () => ({ data: authState.profile, isLoading: false, error: null }) } } } }));

import { AccountPreferenceStartup, type DashboardTab } from "./App";

describe("authenticated App preference startup", () => {
  it("restores profile defaultView, theme, and timezone through the startup component used by App", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addListener: vi.fn(), removeListener: vi.fn() }));
    function Harness() {
      const [activeTab, setActiveTab] = useState<DashboardTab>("all_in_one");
      const [timezone, setTimezone] = useState("UTC");
      return <><AccountPreferenceStartup requestedView={null} activeTab={activeTab} setActiveTab={setActiveTab} onTimezoneChange={setTimezone} /><output data-testid="active-tab">{activeTab}</output><output data-testid="timezone">{timezone}</output></>;
    }
    render(<Harness />);
    await waitFor(() => expect(screen.getByTestId("active-tab").textContent).toBe("research"));
    expect(screen.getByTestId("timezone").textContent).toBe("Asia/Bangkok");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
