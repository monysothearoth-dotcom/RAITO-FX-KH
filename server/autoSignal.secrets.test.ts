import { describe, expect, it } from "vitest";

async function requireOk(url: string, init: RequestInit, label: string) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${label} credential validation failed (${response.status})`);
}

describe("Auto Signal Analyze backend-only credentials", () => {
  it("authenticates the dedicated Telegram bot and configured destination", async () => {
    const token = process.env.AUTO_SIGNAL_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.AUTO_SIGNAL_TELEGRAM_CHAT_ID;
    expect(token).toBeTruthy();
    expect(chatId).toBeTruthy();
    await requireOk(`https://api.telegram.org/bot${token}/getMe`, {}, "Auto Signal Telegram bot");
    await requireOk(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId || "")}`, {}, "Auto Signal Telegram chat");
  }, 20_000);

  it("authenticates Gemini, OpenAI, Claude, and the OpenRouter Grok fallback without exposing a key", async () => {
    const gemini = process.env.GEMINI_API_KEY;
    const openai = process.env.OPENAI_API_KEY;
    const anthropic = process.env.ANTHROPIC_API_KEY;
    const openRouter = process.env.OPENROUTER_API_KEY;
    expect(gemini).toBeTruthy();
    expect(openai).toBeTruthy();
    expect(anthropic).toBeTruthy();
    expect(openRouter).toBeTruthy();
    await Promise.all([
      requireOk(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(gemini || "")}`, {}, "Gemini"),
      requireOk("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${openai}` } }, "OpenAI"),
      requireOk("https://api.anthropic.com/v1/models?limit=1", { headers: { "x-api-key": anthropic || "", "anthropic-version": "2023-06-01" } }, "Anthropic"),
      requireOk("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${openRouter}` } }, "OpenRouter"),
    ]);
  }, 30_000);
});
