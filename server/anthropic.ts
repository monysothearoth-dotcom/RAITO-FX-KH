export type AnthropicMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callAnthropicMessagesWithKey(
  apiKey: string,
  messages: AnthropicMessage[],
  options: { model?: string; maxTokens?: number } = {},
): Promise<string> {
  if (!apiKey?.trim()) throw new Error("Anthropic API key is not configured");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: options.model || "claude-haiku-4-5-20251001",
      max_tokens: options.maxTokens || 800,
      system: messages.find((message) => message.role === "system")?.content,
      messages: messages.filter((message) => message.role !== "system").map((message) => ({ role: message.role, content: message.content })),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({})) as { content?: Array<{ text?: string }>; error?: { message?: string } | string };
  if (!response.ok) throw new Error(typeof payload.error === "object" ? payload.error.message || `Anthropic request failed (${response.status})` : payload.error || `Anthropic request failed (${response.status})`);
  const text = payload.content?.map((part) => part.text || "").join("").trim();
  if (!text) throw new Error("Anthropic returned an empty response");
  return text;
}
