import { describe, expect, it } from "vitest";
import { inferProviderFromModel } from "./aiFallback";

describe("AI fallback provider inference", () => {
  it("maps model labels to configured provider names", () => {
    expect(inferProviderFromModel("openrouter-gemini")).toBe("openrouter");
    expect(inferProviderFromModel("groq-llama")).toBe("groq");
    expect(inferProviderFromModel("anthropic-claude")).toBe("anthropic");
    expect(inferProviderFromModel("openai-gpt")).toBe("openai");
    expect(inferProviderFromModel("deepseek-chat")).toBe("deepseek");
    expect(inferProviderFromModel("nvidia-nemotron")).toBe("nvidia");
    expect(inferProviderFromModel("gemini-2.5-flash")).toBe("gemini");
  });
});
