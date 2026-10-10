import { adminSelectionAtom } from "@bezny/admin/entities";
import { createMemoryHistory } from "@tanstack/react-router";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDemoApplication, DemoApp } from "../src/demo-application.js";
import type { DemoApplication } from "../src/demo-application.js";
import { editorialSessionTokenKey } from "../src/editorial-auth-session.js";
import { editorialUserAtom } from "../src/editorial-auth-state.js";

const applications: DemoApplication[] = [];
const renderLogin = async (locale = "en", path = "/articles") => {
  const application = createDemoApplication(
    createMemoryHistory({ initialEntries: [path] }),
    locale
  );
  applications.push(application);
  render(<DemoApp application={application} />);
  await screen.findByRole("button", {
    name: application.i18n.t("authentication:submit"),
  });
  return { application, user: userEvent.setup() };
};
const openAccount = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Account menu" }));
  return within(await screen.findByRole("menu", { name: "Account menu" }));
};

describe("demo authentication", () => {
  afterEach(() => {
    cleanup();
    for (const application of applications.splice(0)) {
      application.dispose();
    }
  });

  it("starts logged out on deep links, rejects wrong credentials and signs in without storing passwords", async () => {
    const { application, user } = await renderLogin("en", "/pages/1/edit");
    expect(screen.queryByRole("navigation")).toBeNull();
    const email = screen.getByRole("textbox", { name: "Email" });
    await user.type(email, "editor@example.com");
    const password = screen.getByLabelText(/^Password/u);
    await user.type(password, "incorrect{Enter}");
    await screen.findByText(
      "Unable to sign in. Use the demo credentials or try a social login."
    );
    expect(application.store.get(editorialUserAtom)).toBeNull();
    await user.clear(password);
    await user.type(password, "bezny-demo{Enter}");
    await screen.findByRole("textbox", { name: "Title" });
    expect(application.router.state.location.pathname).toBe("/pages/1/edit");
    expect(application.store.get(editorialUserAtom)).toStrictEqual({
      email: "editor@example.com",
      name: "Demo Editor",
      provider: "email",
    });
    expect(screen.queryByLabelText(/^Password/u)).toBeNull();
  });

  it.each([
    { id: "google", initials: "GE", provider: "Google" },
    { id: "github", initials: "GE", provider: "GitHub" },
  ])(
    "simulates $provider sign-in and returns to a clean login on logout",
    async ({ provider, id, initials }) => {
      const { application, user } = await renderLogin();
      await user.click(
        screen.getByRole("button", { name: `Continue with ${provider}` })
      );
      await screen.findByRole("heading", { name: "Welcome to Bezny" });
      expect(application.store.get(editorialUserAtom)?.provider).toBe(id);
      expect(
        screen.getByRole("button", { name: "Account menu" }).textContent
      ).toBe(initials);
      await user.click(
        screen.getByRole("checkbox", { name: "Select Welcome to Bezny" })
      );
      const menu = await openAccount(user);
      await user.click(menu.getByRole("menuitem", { name: "Log out" }));
      await screen.findByRole("heading", { name: "Sign in to Bezny" });
      expect(application.store.get(editorialUserAtom)).toBeNull();
      expect(application.store.get(adminSelectionAtom)).toBeNull();
      expect(
        (screen.getByLabelText(/^Password/u) as HTMLInputElement).value
      ).toBe("");
    }
  );

  it("edits the account with validation and returns focus to the avatar", async () => {
    const { application, user } = await renderLogin();
    await user.click(
      screen.getByRole("button", { name: "Continue with GitHub" })
    );
    const menu = await openAccount(user);
    await user.click(menu.getByRole("menuitem", { name: "Edit account" }));
    const dialog = within(
      await screen.findByRole("dialog", { name: "Edit account" })
    );
    const name = dialog.getByRole("textbox", { name: "Display name" });
    await waitFor(() => expect(document.activeElement).toBe(name));
    await user.clear(name);
    await user.click(dialog.getByRole("button", { name: "Save account" }));
    await dialog.findByText("Enter your name.");
    await user.type(name, "Ada Lovelace");
    const email = dialog.getByRole("textbox", { name: "Email" });
    await user.clear(email);
    await user.type(email, "ada@example.com");
    await user.click(dialog.getByRole("button", { name: "Save account" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(application.store.get(editorialUserAtom)).toStrictEqual({
      email: "ada@example.com",
      name: "Ada Lovelace",
      provider: "github",
    });
    const avatar = screen.getByRole("button", { name: "Account menu" });
    expect(avatar.textContent).toBe("AL");
    await waitFor(() => expect(document.activeElement).toBe(avatar));
  });

  it("cancels account edits with Escape and keeps menu keyboard navigation and focus return", async () => {
    const { application, user } = await renderLogin();
    await user.click(
      screen.getByRole("button", { name: "Continue with Google" })
    );
    const trigger = screen.getByRole("button", { name: "Account menu" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const edit = await screen.findByRole("menuitem", { name: "Edit account" });
    await waitFor(() => expect(document.activeElement).toBe(edit));
    await user.keyboard("{Enter}");
    const name = await screen.findByRole("textbox", { name: "Display name" });
    await user.clear(name);
    await user.type(name, "Unsaved");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(application.store.get(editorialUserAtom)?.name).toBe(
      "Google Editor"
    );
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("menu");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement?.getAttribute("role")).toBe("menuitemradio");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it.each([
    {
      dir: "ltr",
      locale: "cs",
      menu: "Nabídka účtu",
      title: "Přihlášení do Bezny",
    },
    {
      dir: "rtl",
      locale: "ar",
      menu: "قائمة الحساب",
      title: "تسجيل الدخول إلى بيزني",
    },
  ])(
    "localizes login and avatar menu in $locale",
    async ({ locale, title, menu, dir }) => {
      const { application, user } = await renderLogin(locale);
      expect(screen.getByRole("heading", { name: title })).toBeTruthy();
      expect(document.documentElement.dir).toBe(dir);
      await user.click(
        screen.getByRole("button", {
          name: application.i18n.t("authentication:social", {
            provider: "Google",
          }),
        })
      );
      await user.click(screen.getByRole("button", { name: menu }));
      const accountMenu = await screen.findByRole("menu", { name: menu });
      expect(accountMenu.getAttribute("dir")).toBe(dir);
      const selected = within(accountMenu).getByRole("menuitemradio", {
        name: application.i18n.t("beznyAdmin:language", {
          language: locale === "cs" ? "Čeština" : "العربية",
        }),
      });
      expect(selected.getAttribute("aria-checked")).toBe("true");
    }
  );

  it.each(["email", "Google", "GitHub"])(
    "restores %s login from a backend token after refresh and revokes it on logout",
    async (provider) => {
      const { application, user } = await renderLogin();
      if (provider === "email") {
        await user.type(
          screen.getByRole("textbox", { name: "Email" }),
          "editor@example.com"
        );
        await user.type(
          screen.getByLabelText(/^Password/u),
          "bezny-demo{Enter}"
        );
      } else {
        await user.click(
          screen.getByRole("button", { name: `Continue with ${provider}` })
        );
      }
      await screen.findByRole("button", { name: "Account menu" });
      const token = window.sessionStorage.getItem(editorialSessionTokenKey);
      expect(token).toMatch(/^[a-f\d-]{36}$/u);
      expect(window.sessionStorage).toHaveLength(1);
      const identity = application.store.get(editorialUserAtom);
      cleanup();
      application.dispose();
      const refreshed = createDemoApplication(
        createMemoryHistory({ initialEntries: ["/pages/1/edit"] })
      );
      applications.push(refreshed);
      render(<DemoApp application={refreshed} />);
      await screen.findByRole("textbox", { name: "Title" });
      expect(refreshed.store.get(editorialUserAtom)).toStrictEqual(identity);
      const menu = await openAccount(user);
      await user.click(menu.getByRole("menuitem", { name: "Log out" }));
      await screen.findByRole("heading", { name: "Sign in to Bezny" });
      expect(
        window.sessionStorage.getItem(editorialSessionTokenKey)
      ).toBeNull();
      const revoked = await fetch("/api/session", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(revoked.status).toBe(401);
      cleanup();
      refreshed.dispose();
      await renderLogin();
    }
  );

  it("loads edited profile details from the backend after refresh", async () => {
    const { application, user } = await renderLogin();
    await user.click(
      screen.getByRole("button", { name: "Continue with Google" })
    );
    const menu = await openAccount(user);
    await user.click(menu.getByRole("menuitem", { name: "Edit account" }));
    const name = await screen.findByRole("textbox", { name: "Display name" });
    await user.clear(name);
    await user.type(name, "Ada Lovelace");
    const email = screen.getByRole("textbox", { name: "Email" });
    await user.clear(email);
    await user.type(email, "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Save account" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const token = window.sessionStorage.getItem(editorialSessionTokenKey);
    expect(token).not.toContain("Ada");
    cleanup();
    application.dispose();
    const refreshed = createDemoApplication(
      createMemoryHistory({ initialEntries: ["/articles"] })
    );
    applications.push(refreshed);
    render(<DemoApp application={refreshed} />);
    const avatar = await screen.findByRole("button", { name: "Account menu" });
    expect(avatar.textContent).toBe("AL");
    expect(refreshed.store.get(editorialUserAtom)).toStrictEqual({
      email: "ada@example.com",
      name: "Ada Lovelace",
      provider: "google",
    });
  });

  it("rejects invalid tokens instead of trusting browser-stored identity", async () => {
    window.sessionStorage.setItem(
      editorialSessionTokenKey,
      JSON.stringify({
        email: "editor@example.com",
        name: "Forged Editor",
        provider: "email",
      })
    );
    const { application } = await renderLogin();
    expect(application.store.get(editorialUserAtom)).toBeNull();
    expect(window.sessionStorage.getItem(editorialSessionTokenKey)).toBeNull();
  });

  it("retains the token on a network failure and offers session restoration retry", async () => {
    const { application, user } = await renderLogin();
    await user.click(
      screen.getByRole("button", { name: "Continue with Google" })
    );
    await screen.findByRole("button", { name: "Account menu" });
    const token = window.sessionStorage.getItem(editorialSessionTokenKey);
    cleanup();
    application.dispose();
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Offline"));
    const refreshed = createDemoApplication(
      createMemoryHistory({ initialEntries: ["/articles"] })
    );
    applications.push(refreshed);
    render(<DemoApp application={refreshed} />);
    await screen.findByRole("alert");
    expect(window.sessionStorage.getItem(editorialSessionTokenKey)).toBe(token);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("button", { name: "Account menu" });
    expect(refreshed.store.get(editorialUserAtom)?.provider).toBe("google");
  });

  it("keeps sessions application-scoped and clears the user on disposal", async () => {
    const { application, user } = await renderLogin();
    await user.click(
      screen.getByRole("button", { name: "Continue with Google" })
    );
    await screen.findByRole("button", { name: "Account menu" });
    const other = createDemoApplication(
      createMemoryHistory({ initialEntries: ["/articles"] })
    );
    applications.push(other);
    await other.authenticationReady;
    expect(other.store.get(editorialUserAtom)).toStrictEqual(
      application.store.get(editorialUserAtom)
    );
    cleanup();
    application.dispose();
    expect(application.store.get(editorialUserAtom)).toBeNull();
  });
});
