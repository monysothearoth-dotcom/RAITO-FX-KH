/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  profile: { data: { id: 44, openId: "account-ui", name: "Account UI", email: "account@example.com", displayName: "Account UI", timezone: "UTC", defaultView: "all_in_one", theme: "dark" }, isLoading: false, error: null as unknown },
  updateMutation: { mutateAsync: vi.fn(async () => undefined), isPending: false },
  exportQuery: { refetch: vi.fn(async () => ({ data: { user: { id: 44 } } })), isFetching: false },
  deleteMutation: { mutateAsync: vi.fn(async () => undefined), isPending: false },
  login: vi.fn(),
}));

vi.mock("@/const", () => ({ startLogin: state.login }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ account: { profile: { invalidate: vi.fn() } } }),
    account: {
      profile: { useQuery: () => state.profile },
      updateProfile: { useMutation: () => state.updateMutation },
      exportData: { useQuery: () => state.exportQuery },
      deleteAccount: { useMutation: () => state.deleteMutation },
    },
  },
}));

import AccountSettings from "./AccountSettings";

describe("AccountSettings interactions", () => {
  it("opens the identity-provider recovery flow and starts an export", async () => {
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() });
    render(<AccountSettings />);
    fireEvent.click(screen.getByRole("button", { name: /open secure recovery portal/i }));
    expect(state.login).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /download account export/i }));
    await waitFor(() => expect(state.exportQuery.refetch).toHaveBeenCalled());
    expect(screen.getByRole("status").textContent).toContain("export is ready");
  });

  it("shows save success and error states and enables deletion only after exact confirmation", async () => {
    render(<AccountSettings />);
    const name = screen.getAllByLabelText("Display name")[0];
    fireEvent.change(name, { target: { value: "Updated Workspace" } });
    fireEvent.click(screen.getAllByRole("button", { name: /save preferences/i })[0]);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("saved securely"));

    const deleteButton = screen.getAllByRole("button", { name: /delete account permanently/i })[0];
    expect((deleteButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getAllByLabelText(/type delete my account/i)[0], { target: { value: "DELETE MY ACCOUNT" } });
    expect((deleteButton as HTMLButtonElement).disabled).toBe(false);

    state.updateMutation.mutateAsync.mockRejectedValueOnce(new Error("save unavailable"));
    fireEvent.click(screen.getAllByRole("button", { name: /save preferences/i })[0]);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("could not be saved"));
  });
});
