import { afterEach, describe, expect, it, vi } from "vitest";

const invokeLLM = vi.hoisted(() => vi.fn());
vi.mock("./_core/llm", () => ({ invokeLLM }));

import { translateTelegramNewsItemsToKhmer } from "./telegramTranslation";

const items = [
  { title: "Metaplanet expands Bitcoin treasury strategy", url: "https://example.test/news", source: "Cointelegraph RSS", category: "crypto" as const, timestamp: 1, relatedCurrency: "BTC" },
  { title: "ECB keeps interest rates unchanged", category: "forex" as const, timestamp: 2, relatedCurrency: "EUR" },
];

afterEach(() => {
  invokeLLM.mockReset();
  vi.unstubAllGlobals();
});

describe("Telegram Khmer translation", () => {
  it("maps Claude structured translations back to the original headlines", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ translations: [{ id: 0, khmer: "Metaplanet ពង្រីកយុទ្ធសាស្ត្ររតនាគារ Bitcoin" }, { id: 1, khmer: "ECB រក្សាអត្រាការប្រាក់ដដែល" }] }) } }] });
    const translated = await translateTelegramNewsItemsToKhmer(items);
    expect(translated.map((item) => item.khmerTitle)).toEqual(["Metaplanet ពង្រីកយុទ្ធសាស្ត្ររតនាគារ Bitcoin", "ECB រក្សាអត្រាការប្រាក់ដដែល"]);
    expect(invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ model: "claude-haiku-4-5" }));
  });

  it("preserves an English headline only when a mixed Claude batch has no Khmer entry for it", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ translations: [{ id: 0, khmer: "not translated" }, { id: 1, khmer: "ECB រក្សាអត្រាការប្រាក់ដដែល" }] }) } }] });
    const translated = await translateTelegramNewsItemsToKhmer(items);
    expect(translated[0].khmerTitle).toBeUndefined();
    expect(translated[1].khmerTitle).toContain("ECB");
  });

  it("uses the secure Gemini fallback when the primary provider returns no usable Khmer payload", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ translations: [] }) } }] });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ translations: [{ id: 0, khmer: "Metaplanet ពង្រីកយុទ្ធសាស្ត្ររតនាគារ Bitcoin" }, { id: 1, khmer: "ECB រក្សាអត្រាការប្រាក់ដដែល" }] }) }] } }] }) }));
    const translated = await translateTelegramNewsItemsToKhmer(items);
    expect(translated.every((item) => item.khmerTitle)).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
