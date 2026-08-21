import { GEMINI_GENERATE_URL } from "./aiConfig";
import { invokeLLM } from "./_core/llm";
import type { TelegramNewsItem } from "./telegramNews";

const KHMER_CHARACTERS = /[\u1780-\u17FF]/;
type TranslationEntry = { id?: number; khmer?: string };

function isUsableKhmerTranslation(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 400 && KHMER_CHARACTERS.test(value);
}

function parseTranslationPayload(raw: unknown): TranslationEntry[] {
  if (typeof raw !== "string") return [];
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { translations?: TranslationEntry[] };
    return Array.isArray(parsed.translations) ? parsed.translations : [];
  } catch {
    return [];
  }
}

function applyTranslations(items: TelegramNewsItem[], entries: TranslationEntry[]) {
  const translations = new Map(entries.map((entry) => [Number(entry.id), entry.khmer]));
  return items.map((item, index) => ({ ...item, khmerTitle: isUsableKhmerTranslation(translations.get(index)) ? translations.get(index)!.trim() : undefined }));
}

function hasKhmerTranslation(items: TelegramNewsItem[]) {
  return items.some((item) => isUsableKhmerTranslation(item.khmerTitle));
}

function translationInstruction(items: TelegramNewsItem[]) {
  return JSON.stringify({
    task: "Translate every English financial-news headline into natural Khmer.",
    rules: ["Preserve company names, tickers, numbers, BTC amounts, and proper nouns when appropriate.", "Do not add commentary, source names, URLs, or extra punctuation.", "Return exactly one JSON object: {\"translations\":[{\"id\":0,\"khmer\":\"...\"}]} with every supplied id."],
    headlines: items.map((item, index) => ({ id: index, english: item.title })),
  });
}

async function translateWithClaude(items: TelegramNewsItem[]) {
  const response = await invokeLLM({
    model: "claude-haiku-4-5",
    maxTokens: 2200,
    messages: [
      { role: "system", content: "You are a precise Khmer financial-news translator. Follow the requested JSON shape exactly and do not use Markdown fences." },
      { role: "user", content: translationInstruction(items) },
    ],
  });
  return applyTranslations(items, parseTranslationPayload(response.choices?.[0]?.message?.content));
}

async function translateWithGemini(items: TelegramNewsItem[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini translation fallback is not configured");
  const response = await fetch(`${GEMINI_GENERATE_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: translationInstruction(items) }] }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({})) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || `Gemini translation fallback failed (${response.status})`);
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  return applyTranslations(items, parseTranslationPayload(text));
}

export async function translateTelegramNewsItemsToKhmer(items: TelegramNewsItem[]): Promise<TelegramNewsItem[]> {
  if (!items.length) return items;
  try {
    const claudeTranslations = await translateWithClaude(items);
    if (hasKhmerTranslation(claudeTranslations)) return claudeTranslations;
  } catch (error) {
    console.warn("[TelegramNews] Claude Khmer translation unavailable; trying Gemini fallback", error instanceof Error ? error.message : "unknown error");
  }
  const geminiTranslations = await translateWithGemini(items);
  if (!hasKhmerTranslation(geminiTranslations)) throw new Error("Khmer translation providers returned no usable Khmer text");
  return geminiTranslations;
}
