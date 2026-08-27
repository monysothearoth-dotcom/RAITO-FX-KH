import { describe, expect, it, vi } from "vitest";
import { createSingleFlightPoller, runEnabledAutoSignalMonitors } from "./continuousAutoSignal";

describe("always-on Auto Signal worker", () => {
  it("uses one market snapshot for each enabled owner monitor cycle", async () => {
    const fetchPrices = vi.fn(async () => ({ "OANDA:XAUUSD": { price: 4500, change: 0, changePercent: 0, high: 4500, low: 4500 } }));
    const runMonitor = vi.fn(async () => undefined);
    const result = await runEnabledAutoSignalMonitors({
      listSettings: async () => [
        { userId: 1, isEnabled: 1, minConfidence: 78, minScore: 82, minRiskReward: 1.8 },
        { userId: 2, isEnabled: 0, minConfidence: 78, minScore: 82, minRiskReward: 1.8 },
      ],
      fetchPrices,
      runMonitor,
    });
    expect(result).toEqual({ monitored: 1, failures: 0 });
    expect(fetchPrices).toHaveBeenCalledTimes(1);
    expect(runMonitor).toHaveBeenCalledTimes(1);
    expect(runMonitor.mock.calls[0][0]).toMatchObject({ userId: 1 });
  });

  it("schedules a following poll only after the current cycle completes", async () => {
    vi.useFakeTimers();
    const run = vi.fn(async () => undefined);
    const poller = createSingleFlightPoller({ intervalMs: 15_000, run });
    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(14_999);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(2);
    poller.stop();
    vi.useRealTimers();
  });
});
