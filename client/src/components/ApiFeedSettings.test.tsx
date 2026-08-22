// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ApiFeedSettings from "./ApiFeedSettings";

describe("ApiFeedSettings secure provider controls", () => {
  it("renders no browser API-key overrides or IEX Cloud option", () => {
    const { container } = render(
      <ApiFeedSettings
        apiProvider="auto"
        onProviderChange={vi.fn()}
        onForceRefresh={async () => undefined}
        currentSource="Auto"
        isRefreshing={false}
        simulatedTicksEnabled={false}
        onSimulatedTicksToggle={vi.fn()}
      />,
    );

    expect(screen.queryByText("Overwrite Provider API Keys")).toBeNull();
    expect(screen.queryByText(/IEX Cloud/i)).toBeNull();
    expect(container.querySelectorAll('input[type="password"]')).toHaveLength(0);
    expect(screen.getByText(/managed securely by the server/i)).toBeTruthy();
  });
});
