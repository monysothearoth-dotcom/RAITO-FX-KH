import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AuthModal, { authLaunchErrorMessage } from "./AuthModal";

describe("AuthModal", () => {
  it("renders secure login guidance without collecting credentials locally", () => {
    const html = renderToStaticMarkup(createElement(AuthModal, { isOpen: true, onClose: () => undefined, defaultMode: "login" }));
    expect(html).toContain("Continue to Log In");
    expect(html).toContain("Saved account data");
    expect(html).toContain("secure account portal");
    expect(html).not.toContain("Email Address");
    expect(html).not.toContain("Password");
  });

  it("renders the visible OAuth launch recovery state", () => {
    const html = renderToStaticMarkup(createElement(AuthModal, { isOpen: true, onClose: () => undefined, defaultMode: "login", initialError: authLaunchErrorMessage(new Error("network")) }));
    expect(html).toContain("Unable to open the secure account portal");
    expect(html).toContain('role="alert"');
    expect(html).toContain("Continue to Log In");
  });

  it("renders the secure sign-up path and account-storage explanation", () => {
    const html = renderToStaticMarkup(createElement(AuthModal, { isOpen: true, onClose: () => undefined, defaultMode: "signup" }));
    expect(html).toContain("Continue to Sign Up");
    expect(html).toContain("Your profile and dashboard records will be saved to your account.");
  });
});

