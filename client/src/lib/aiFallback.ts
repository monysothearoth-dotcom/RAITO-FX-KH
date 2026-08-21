export const AI_PROVIDER_NAMES = ['gemini', 'openrouter', 'groq', 'anthropic', 'openai', 'deepseek', 'nvidia'] as const;

export type RuntimeAiFallbackPayload = {
  fallbackProviders: string[];
  apiKeys: Record<string, string>;
};

export function inferProviderFromModel(model: string): string {
  const value = model.toLowerCase();
  if (value.includes('openrouter')) return 'openrouter';
  if (value.includes('groq')) return 'groq';
  if (value.includes('claude') || value.includes('anthropic')) return 'anthropic';
  if (value.includes('deepseek')) return 'deepseek';
  if (value.includes('nvidia') || value.includes('nemotron')) return 'nvidia';
  if (value.includes('gpt') || value.includes('openai')) return 'openai';
  return 'gemini';
}

export function getRuntimeAiWatchPayload(primaryKey?: string): RuntimeAiFallbackPayload & { watchProviders: string[] } {
  let stored: Record<string, string> = {};
  try {
    const parsed = JSON.parse(localStorage.getItem('raito_ai_fallback_keys') || '{}');
    if (parsed && typeof parsed === 'object') stored = parsed;
  } catch {
    stored = {};
  }
  const apiKeys = { ...stored };
  if (primaryKey?.trim()) apiKeys.gemini = primaryKey.trim();
  const watchProviders = ['gemini', ...AI_PROVIDER_NAMES.filter((provider) => provider !== 'gemini' && Boolean(apiKeys[provider]?.trim())), 'platform'];
  return { watchProviders: Array.from(new Set(watchProviders)), fallbackProviders: [], apiKeys };
}

export function getRuntimeAiFallbackPayload(model: string, primaryKey?: string): RuntimeAiFallbackPayload {
  const primary = inferProviderFromModel(model);
  let stored: Record<string, string> = {};
  try {
    const parsed = JSON.parse(localStorage.getItem('raito_ai_fallback_keys') || '{}');
    if (parsed && typeof parsed === 'object') stored = parsed;
  } catch {
    stored = {};
  }
  const apiKeys = { ...stored };
  if (primaryKey?.trim()) apiKeys[primary] = primaryKey.trim();
  const fallbackProviders = AI_PROVIDER_NAMES.filter((provider) => provider !== primary && Boolean(apiKeys[provider]?.trim()));
  return { fallbackProviders, apiKeys };
}
