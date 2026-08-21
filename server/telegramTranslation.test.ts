import { describe, expect, it, vi } from "vitest";

const invokeLLM = vi.hoisted(() => vi.fn());
vi.mock("./_core/llm", () => ({ invokeLLM }));

import { translateTelegramNewsItemsToKhmer } from "./telegramTranslation";

const items = [
  { title: "Metaplanet expands Bitcoin treasury strategy", url: "https://example.test/news", source: "Cointelegraph RSS", category: "crypto" as const, timestamp: 1, relatedCurrency: "BTC" },
  { title: "ECB keeps interest rates unchanged", category: "forex" as const, timestamp: 2, relatedCurrency: "EUR" },
];

describe("Telegram Khmer translation", () => {
  it("maps structured translations back to the original headlines", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ translations: [{ id: 0, khmer: "Metaplanet ពង្រីកយុទ្ធសាស្ត្ររតនាគារ Bitcoin" }, { id: 1, khmer: "ECB រក្សាអត្រាការប្រាក់ដដែល" }] }) } }] });
    const translated = await translateTelegramNewsItemsToKhmer(items);
    expect(translated.map((item) => item.khmerTitle)).toEqual(["Metaplanet ពង្រីកយុទ្ធសាស្ត្ររតនាគារ Bitcoin", "ECB រក្សាអត្រាការប្រាក់ដដែល"]);
    expect(translated[0].title).toBe(items[0].title);
  });

  it("rejects non-Khmer output per item without changing the English headline", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ translations: [{ id: 0, khmer: "not translated" }, { id: 1, khmer: "ECB រក្សាអត្រាការប្រាក់ដដែល" }] }) } }] });
    const translated = await translateTelegramNewsItemsToKhmer(items);
    expect(translated[0].khmerTitle).toBeUndefined();
    expect(translated[1].khmerTitle).toContain("ECB");
  });
});
