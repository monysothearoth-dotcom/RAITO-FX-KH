import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getTradingViewStudies, ResponsiveChartControls, responsiveChartControlsClassName } from "./TradingViewChart";

describe("responsive chart controls", () => {
  it("renders the actual chart-control wrapper with responsive classes", () => {
    const html = renderToStaticMarkup(createElement(ResponsiveChartControls, null, createElement("button", null, "Candles")));
    expect(html).toContain("flex-wrap");
    expect(html).toContain("min-w-0");
    expect(html).toContain("Candles");
    expect(responsiveChartControlsClassName).toContain("justify-between");
  });
});

describe("getTradingViewStudies", () => {
  it("includes the selected moving averages and volume study", () => {
    expect(getTradingViewStudies(true, true, true)).toEqual([
      "RSI@tv-basicstudies",
      "MASimple@tv-basicstudies",
      "MAExp@tv-basicstudies",
      "Volume@tv-basicstudies",
    ]);
  });

  it("can disable optional overlays while retaining RSI", () => {
    expect(getTradingViewStudies(false, false, false)).toEqual(["RSI@tv-basicstudies"]);
  });
});
