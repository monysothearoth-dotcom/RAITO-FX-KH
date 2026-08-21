import { describe, expect, it } from "vitest";

describe("Telegram credentials", () => {
  it("authenticates the configured bot without exposing its token", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    expect(token).toBeTruthy();
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const payload = await response.json() as { ok?: boolean; result?: { is_bot?: boolean } };
    expect(response.ok).toBe(true);
    expect(payload.ok).toBe(true);
    expect(payload.result?.is_bot).toBe(true);
    const chatId = process.env.TELEGRAM_CHAT_ID;
    expect(chatId).toBeTruthy();
    const chatResponse = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId || "")}`);
    const chatPayload = await chatResponse.json() as { ok?: boolean };
    expect(chatResponse.ok).toBe(true);
    expect(chatPayload.ok).toBe(true);
  }, 15_000);
});
