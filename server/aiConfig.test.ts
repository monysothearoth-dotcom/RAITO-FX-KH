import { describe, expect, it } from "vitest";
import { GEMINI_GENERATE_URL, GEMINI_MODEL } from "./aiConfig";

describe("Gemini AI route configuration", () => {
  it("uses the current Gemini model shared by all AI flows", () => {
    expect(GEMINI_MODEL).toBe("gemini-3.6-flash");
    expect(GEMINI_GENERATE_URL).toContain(`/models/${GEMINI_MODEL}:generateContent`);
    expect(GEMINI_MODEL).not.toBe("gemini-2.5-flash");
  });
});
