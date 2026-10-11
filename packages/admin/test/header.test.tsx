import "../../base/test/dom-observers.js";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createRef } from "react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminCommand } from "../src/admin-entity-model.js";
import type { AdminAccountValues } from "../src/admin-header.js";
import {
  AdminHeader,
  AdminAccountMenu,
  AdminCommandPalette,
} from "../src/admin-header.js";
import { createAdminI18n } from "../src/admin-i18n.js";

const mount = (content: ReactNode, language = "en") =>
  render(
    <I18nextProvider i18n={createAdminI18n({ lng: language })}>
      {content}
    </I18nextProvider>
  );
const account = { email: "ada@example.test", name: "Ada Lovelace" };

describe("admin header chrome", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("owns title/tool arrangement and forwards root props without an entity provider for explicit commands", () => {
    const ref = createRef<HTMLDivElement>();
    mount(
      <AdminHeader
        ref={ref}
        className="brand"
        data-testid="chrome"
        title="Research"
        commandPalette={{ commands: [] }}
        account={{ user: account }}
      />
    );
    expect(screen.getByText("Research")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Command palette" })
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Account menu" })).toBeDefined();
    expect(ref.current).toBe(screen.getByTestId("chrome"));
    expect(ref.current?.classList.contains("brand")).toBeTruthy();
  });

  it("supports optional tools and omitting the default palette/account", () => {
    mount(
      <AdminHeader
        title="Research"
        commandPalette={false}
        tools={<button type="button">Help</button>}
      />
    );
    expect(
      screen.queryByRole("button", { name: "Command palette" })
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Account menu" })).toBeNull();
    expect(screen.getByRole("button", { name: "Help" })).toBeDefined();
  });

  it("searches and executes explicit commands by keyboard after closing and restores focus", async () => {
    const user = userEvent.setup();
    const execute = vi.fn<() => void>();
    mount(
      <AdminCommandPalette
        commands={[{ execute, id: "research.open", label: "Open research" }]}
      />
    );
    const trigger = screen.getByRole("button", { name: "Command palette" });
    fireEvent.keyDown(document, { ctrlKey: true, key: "k" });
    const dialog = within(
      await screen.findByRole("dialog", { name: "Command palette" })
    );
    await user.type(
      dialog.getByRole("combobox", { name: "Search commands" }),
      "research"
    );
    await user.keyboard("{Enter}");
    await waitFor(() => expect(execute).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("binds parameterized commands through RHF before execution", async () => {
    const user = userEvent.setup();
    const apply = vi.fn<(value: string) => void>();
    const command: AdminCommand = {
      execute: vi.fn<() => void>(),
      id: "query",
      input: { execute: apply, label: "Search query", value: "" },
      label: "Search records",
    };
    mount(<AdminCommandPalette commands={[command]} shortcut={false} />);
    await user.click(screen.getByRole("button", { name: "Command palette" }));
    await user.click(screen.getByRole("option", { name: "Search records" }));
    await user.type(
      screen.getByRole("textbox", { name: "Search query" }),
      "nebula"
    );
    await user.click(screen.getByRole("button", { name: "Apply command" }));
    await waitFor(() => expect(apply).toHaveBeenCalledWith("nebula"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("honors disabled shortcuts and localized empty state", async () => {
    const user = userEvent.setup();
    mount(<AdminCommandPalette commands={[]} shortcut={false} />, "cs");
    fireEvent.keyDown(document, { ctrlKey: true, key: "k" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Paleta příkazů" }));
    await expect(
      screen.findByText("Žádné odpovídající příkazy.")
    ).resolves.toBeDefined();
  });

  it("validates and saves account values through the supplied host callback", async () => {
    const user = userEvent.setup();
    const save = vi.fn<(values: AdminAccountValues) => Promise<void>>(
      async () => {}
    );
    mount(<AdminAccountMenu user={account} onSave={save} />);
    const trigger = screen.getByRole("button", { name: "Account menu" });
    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: "Edit account" }));
    const name = screen.getByRole("textbox", { name: "Display name" });
    await user.clear(name);
    await user.type(name, " Grace Hopper ");
    await user.click(screen.getByRole("button", { name: "Save account" }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        email: account.email,
        name: "Grace Hopper",
      })
    );
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("announces save failure and permits retry without losing edits", async () => {
    const user = userEvent.setup();
    const save = vi
      .fn<(values: AdminAccountValues) => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue();
    mount(<AdminAccountMenu user={account} onSave={save} />);
    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit account" }));
    await user.click(screen.getByRole("button", { name: "Save account" }));
    await expect(screen.findByRole("alert")).resolves.toBeDefined();
    expect(
      screen
        .getByRole("textbox", { name: "Display name" })
        .getAttribute("value")
    ).toBe(account.name);
    await user.click(screen.getByRole("button", { name: "Save account" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("delegates logout, reports rejection, and permits retry", async () => {
    const user = userEvent.setup();
    const logout = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue();
    mount(<AdminAccountMenu user={account} onLogout={logout} />);
    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Log out" }));
    await expect(
      screen.findByText("Unable to log out. Please try again.")
    ).resolves.toBeDefined();
    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Log out" }));
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(2));
  });
});
