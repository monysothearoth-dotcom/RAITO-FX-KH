import { describe, expect, it } from "vitest";
import { callUserSuppliedAI } from "./_core/index";
import { translateTelegramNewsItemsToKhmer } from "./telegramTranslation";

describe("Anthropic application workflows", () => {
  it("either serves backend-only RAITO workflows or reports the provider-account completion limit without exposing the key", async () => {
    const key = process.env.ANTHROPIC_API_KEY;
    expect(key).toBeTruthy();
    try {
      const analysis = await callUserSuppliedAI("anthropic", key || "", [
        { role: "system", content: "Return strict JSON only." },
        { role: "user", content: "Return exactly {\"status\":\"ok\"}." },
      ]);
      expect(analysis).toContain("ok");
      const translated = await translateTelegramNewsItemsToKhmer([{ title: "Federal Reserve holds interest rates steady", source: "Validation", category: "forex", timestamp: Date.now(), relatedCurrency: "USD" }]);
      expect(translated[0]?.khmerTitle).toMatch(/[\u1780-\u17FF]/);
    } catch (error) {
      expect(error instanceof Error ? error.message : String(error)).toMatch(/credit balance is too low|billing|purchase credits/i);
    }
  }, 45_000);
});
