import { describe, expect, it } from "vitest";
import { parseAlphaVantageGlobalQuote } from "./alphaVantage";

describe("Alpha Vantage quote parser", () => {
  it("converts a Global Quote response into the application price contract", () => {
    expect(parseAlphaVantageGlobalQuote({
      "Global Quote": {
        "03. high": "201.20",
        "04. low": "198.10",
        "05. price": "200.50",
        "08. previous close": "199.00",
        "09. change": "1.50",
        "10. change percent": "0.7538%",
      },
    })).toEqual({ price: 200.5, change: 1.5, changePercent: 0.7538, high: 201.2, low: 198.1 });
  });

  it("rejects incomplete or unusable provider payloads", () => {
    expect(parseAlphaVantageGlobalQuote({})).toBeNull();
    expect(parseAlphaVantageGlobalQuote({ "Global Quote": { "05. price": "" } })).toBeNull();
  });
});
