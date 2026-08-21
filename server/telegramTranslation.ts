import { invokeLLM } from "./_core/llm";
import type { TelegramNewsItem } from "./telegramNews";

const KHMER_CHARACTERS = /[\u1780-\u17FF]/;

function isUsableKhmerTranslation(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 400 && KHMER_CHARACTERS.test(value);
}

export async function translateTelegramNewsItemsToKhmer(items: TelegramNewsItem[]): Promise<TelegramNewsItem[]> {
  if (!items.length) return items;
  const response = await invokeLLM({
    model: "gpt-5-mini",
    maxTokens: 1800,
    messages: [
      { role: "system", content: "You translate financial news headlines into natural Khmer. Return only the requested JSON. Preserve company names, tickers, numbers, BTC amounts, and proper nouns when appropriate. Do not add commentary, source names, URLs, or extra punctuation." },
      { role: "user", content: JSON.stringify(items.map((item, index) => ({ id: index, english: item.title }))) },
    ],
    outputSchema: {
      name: "khmer_news_translations",
      strict: true,
      schema: {
        type: "object",
        properties: {
          translations: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "integer" }, khmer: { type: "string" } },
              required: ["id", "khmer"],
              additionalProperties: false,
            },
          },
        },
        required: ["translations"],
        additionalProperties: false,
      },
    },
  });
  const content = response.choices?.[0]?.message?.content;
  const parsed = typeof content === "string" ? JSON.parse(content) as { translations?: Array<{ id?: number; khmer?: string }> } : {};
  const translations = new Map((parsed.translations || []).map((entry) => [Number(entry.id), entry.khmer]));
  return items.map((item, index) => ({ ...item, khmerTitle: isUsableKhmerTranslation(translations.get(index)) ? translations.get(index)!.trim() : undefined }));
}
