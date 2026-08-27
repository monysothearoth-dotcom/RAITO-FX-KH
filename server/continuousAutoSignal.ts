import type { AutoSignalPrice } from "./autoSignal";

export type AutoSignalRunnerSettings = {
  userId: number;
  isEnabled: number;
  minConfidence: number;
  minScore: number;
  minRiskReward: number;
};

export function createSingleFlightPoller(input: { intervalMs: number; run: () => Promise<void>; onError?: (error: unknown) => void }) {
  let stopped = true;
  let running = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = (delayMs: number) => {
    if (stopped) return;
    timer = setTimeout(() => void tick(), delayMs);
  };

  const tick = async () => {
    if (stopped || running) return;
    running = true;
    try {
      await input.run();
    } catch (error) {
      input.onError?.(error);
    } finally {
      running = false;
      schedule(input.intervalMs);
    }
  };

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      schedule(0);
    },
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
    isRunning: () => running,
  };
}

export async function runEnabledAutoSignalMonitors(input: {
  listSettings: () => Promise<AutoSignalRunnerSettings[]>;
  fetchPrices: () => Promise<Record<string, AutoSignalPrice>>;
  runMonitor: (settings: AutoSignalRunnerSettings, fetchPrices: () => Promise<Record<string, AutoSignalPrice>>) => Promise<unknown>;
  markTick?: (settings: AutoSignalRunnerSettings) => Promise<void>;
  onMonitorError?: (settings: AutoSignalRunnerSettings, error: unknown) => void;
}) {
  const settings = (await input.listSettings()).filter((setting) => Boolean(setting.isEnabled));
  if (!settings.length) return { monitored: 0, failures: 0 };
  await Promise.all(settings.map((setting) => input.markTick?.(setting)));
  const prices = await input.fetchPrices();
  let failures = 0;
  for (const setting of settings) {
    try {
      await input.runMonitor(setting, async () => prices);
    } catch (error) {
      failures += 1;
      input.onMonitorError?.(setting, error);
    }
  }
  return { monitored: settings.length, failures };
}
