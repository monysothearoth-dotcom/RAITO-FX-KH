export type ProviderMessage = { role: string; content: string };

export function parseStructuredAiJson(raw: string): Record<string, unknown> | null {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export type FallbackResult = {
  text: string;
  provider: string;
  attemptedProviders: string[];
  failures: string[];
};

export async function callWithProviderFallback(
  primaryProvider: string,
  primaryKey: string,
  fallbackProviders: unknown,
  apiKeys: unknown,
  messages: ProviderMessage[],
  caller: (provider: string, apiKey: string, messages: ProviderMessage[]) => Promise<string>,
): Promise<FallbackResult> {
  const requestedFallbacks = Array.isArray(fallbackProviders) ? fallbackProviders.map((provider) => String(provider).toLowerCase()) : [];
  const keys = apiKeys && typeof apiKeys === 'object' ? apiKeys as Record<string, unknown> : {};
  const chain = Array.from(new Set([primaryProvider.toLowerCase(), ...requestedFallbacks]));
  const failures: string[] = [];
  for (const provider of chain) {
    const key = provider === primaryProvider.toLowerCase() ? primaryKey : String(keys[provider] || '');
    if (!key?.trim()) {
      failures.push(`${provider}:missing-key`);
      continue;
    }
    try {
      const text = await caller(provider, key, messages);
      return { text, provider, attemptedProviders: chain.slice(0, chain.indexOf(provider) + 1), failures };
    } catch (error) {
      failures.push(`${provider}:${error instanceof Error ? error.message : 'request-failed'}`);
    }
  }
  throw new Error(`All configured AI providers failed. Attempts: ${failures.map((failure) => failure.split(':').slice(0, 2).join(':')).join(', ')}`);
}
