/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: { name: "saved-trader", email: "saved@example.com", openId: "saved-open-id" },
  profile: { defaultView: "research", theme: "light", timezone: "Asia/Bangkok" },
}));
const Panel = vi.hoisted(() => ({ children, label }: { children?: React.ReactNode; label: string }) => <div data-testid={`mock-${label}`}>{label}{children}</div>);

vi.mock("./_core/hooks/useAuth", () => ({ useAuth: () => ({ user: authState.user, loading: false, error: null, logout: vi.fn() }) }));
vi.mock("./lib/trpc", () => ({ trpc: { account: { profile: { useQuery: () => ({ data: authState.profile, isLoading: false, error: null }) } } } }));
vi.mock("./context/CurrencyContext", () => ({ useCurrency: () => ({ currency: "USD", setCurrency: vi.fn() }), SUPPORTED_CURRENCIES: { USD: { code: "USD", symbol: "$", name: "US Dollar" } } }));
vi.mock("motion/react", () => ({ motion: { div: ({ children }: { children?: React.ReactNode }) => <div>{children}</div> }, AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</> }));
vi.mock("lucide-react", () => ({ TrendingUp: Panel, Info: Panel, Shield: Panel, Activity: Panel, Flame: Panel, Globe: Panel, LineChart: Panel, Cpu: Panel, Newspaper: Panel, Compass: Panel, Calendar: Panel, SlidersHorizontal: Panel, LogIn: Panel, UserPlus: Panel, LogOut: Panel, UserCheck: Panel, Bell: Panel, X: Panel, BookOpen: Panel, PieChart: Panel, Settings: Panel }));
vi.mock("./components/TickerTape", () => ({ default: () => <Panel label="ticker" /> }));
vi.mock("./components/TickerHeader", () => ({ default: () => <Panel label="ticker-header" /> }));
vi.mock("./components/MarketList", () => ({ default: () => <Panel label="market-list" /> }));
vi.mock("./components/TechnicalAnalysisWidget", () => ({ default: () => <Panel label="technical" /> }));
vi.mock("./components/AllInOneAiHub", () => ({ default: () => <Panel label="all-in-one" /> }));
vi.mock("./components/ResearchLibrary", () => ({ default: () => <div data-testid="research-library">Research Library workspace</div> }));
vi.mock("./components/MarketDataPanels", () => ({ MacroIndicatorsPanel: () => <Panel label="macro" />, CryptoMetricsPanel: () => <Panel label="crypto" /> }));
vi.mock("./components/PaperTradingPanel", () => ({ default: () => <Panel label="paper-trading" /> }));
vi.mock("./components/AccountSettings", () => ({ default: () => <Panel label="account-settings" />, formatAccountClock: () => "clock" }));

import App from "./App";

afterEach(() => { vi.restoreAllMocks(); });

describe("literal authenticated App startup", () => {
  it("renders the real App into the persisted research workspace and applies the light theme", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addListener: vi.fn(), removeListener: vi.fn() }));
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({}) })));
    vi.stubGlobal("WebSocket", class { close() {} addEventListener() {} send() {} });
    vi.stubGlobal("setInterval", vi.fn(() => 0));
    vi.stubGlobal("clearInterval", vi.fn());
    vi.stubGlobal("setTimeout", vi.fn(() => 0));
    vi.stubGlobal("clearTimeout", vi.fn());
    window.history.replaceState({}, "", "?view=");
    const { unmount } = render(<App />);
    expect(screen.getByTestId("research-library")).toBeTruthy();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.getElementById("global-currency-toggle-select")).toBeNull();
    unmount();
  });
});
