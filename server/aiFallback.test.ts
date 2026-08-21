import { describe, expect, it } from "vitest";
import { callWithProviderFallback, parseStructuredAiJson } from "./aiFallback";

describe("parseStructuredAiJson", () => {
  it("parses fenced Gemini JSON responses", () => {
    expect(parseStructuredAiJson("```json\n{\"recommendation\":\"BUY\",\"confidence\":62}\n```"))
      .toEqual({ recommendation: "BUY", confidence: 62 });
  });

  it("returns null for non-JSON prose", () => {
    expect(parseStructuredAiJson("No structured signal available")).toBeNull();
  });
});

describe("callWithProviderFallback", () => {
  it("retries providers in order and returns sanitized status metadata", async () => {
    const calls: string[] = [];
    const result = await callWithProviderFallback(
      "gemini",
      "primary-secret",
      ["openai", "groq"],
      { openai: "fallback-secret", groq: "unused-secret" },
      [{ role: "user", content: "analyze" }],
      async (provider) => {
        calls.push(provider);
        if (provider === "gemini") throw new Error("temporary failure");
        return "fallback response";
      },
    );

    expect(calls).toEqual(["gemini", "openai"]);
    expect(result.provider).toBe("openai");
    expect(result.attemptedProviders).toEqual(["gemini", "openai"]);
    expect(JSON.stringify(result)).not.toContain("primary-secret");
    expect(JSON.stringify(result)).not.toContain("fallback-secret");
  });

  it("skips fallback providers without runtime keys", async () => {
    const calls: string[] = [];
    const result = await callWithProviderFallback(
      "gemini",
      "primary-secret",
      ["openai", "groq"],
      { groq: "groq-secret" },
      [],
      async (provider) => {
        calls.push(provider);
        return "response";
      },
    );

    expect(calls).toEqual(["gemini"]);
    expect(result.provider).toBe("gemini");
    expect(JSON.stringify(result)).not.toContain("groq-secret");
  });
});
