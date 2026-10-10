// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginScreen } from "../src/auth/login-screen.js";
import type { LoginCredentials } from "../src/auth/login-screen.js";

const failedLogin = () => Promise.reject(new Error("Private provider details"));

describe("login screen", () => {
  afterEach(cleanup);

  it("validates credentials, focuses invalid fields and submits via Enter", async () => {
    const onLogin = vi.fn<(credentials: LoginCredentials) => void>();
    const user = userEvent.setup();
    render(<LoginScreen onLogin={onLogin} />);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByText("Enter your email.");
    const email = screen.getByRole("textbox", { name: "Email" });
    expect(document.activeElement).toBe(email);
    expect(email.getAttribute("aria-invalid")).toBe("true");
    await user.type(email, "invalid");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByText("Enter a valid email.");
    await user.clear(email);
    await user.type(email, "ada@example.com");
    const password = screen.getByLabelText(/^Password/u);
    expect(password.getAttribute("type")).toBe("password");
    expect(password.getAttribute("autocomplete")).toBe("current-password");
    await user.type(password, "secret{Enter}");
    await waitFor(() =>
      expect(onLogin).toHaveBeenCalledExactlyOnceWith({
        email: "ada@example.com",
        password: "secret",
      })
    );
  });

  it("runs social login without credential validation and blocks concurrent actions", async () => {
    const pending = Promise.withResolvers<null>();
    const socialLogin = vi.fn<() => Promise<void>>(async () => {
      await pending.promise;
    });
    const onLogin = vi.fn<(credentials: LoginCredentials) => void>();
    const user = userEvent.setup();
    render(
      <LoginScreen
        onLogin={onLogin}
        socialProviders={[
          { id: "github", label: "Continue with GitHub", onLogin: socialLogin },
        ]}
      />
    );
    const socialButton = screen.getByRole("button", {
      name: "Continue with GitHub",
    });
    await user.click(socialButton);
    expect(screen.getByRole("form").getAttribute("aria-busy")).toBe("true");
    expect((socialButton as HTMLButtonElement).disabled).toBeTruthy();
    await user.click(socialButton);
    expect(socialLogin).toHaveBeenCalledOnce();
    pending.resolve(null);
    await waitFor(() =>
      expect(screen.getByRole("form").getAttribute("aria-busy")).toBe("false")
    );
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("reports a safe error and permits retry for either login path", async () => {
    const onLogin =
      vi.fn<(credentials: LoginCredentials) => Promise<void>>(failedLogin);
    const socialLogin = vi.fn<() => Promise<void>>(failedLogin);
    const user = userEvent.setup();
    render(
      <LoginScreen
        onLogin={onLogin}
        socialProviders={[
          { id: "github", label: "GitHub", onLogin: socialLogin },
        ]}
      />
    );
    await user.click(screen.getByRole("button", { name: "GitHub" }));
    const error = await screen.findByRole("alert");
    expect(error.textContent).toBe("Unable to sign in. Please try again.");
    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "ada@example.com"
    );
    await user.type(screen.getByLabelText(/^Password/u), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("alert");
    expect(onLogin).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "GitHub" }));
    await waitFor(() => expect(socialLogin).toHaveBeenCalledTimes(2));
  });
});
