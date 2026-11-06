import { createMemoryHistory, Outlet } from "@tanstack/react-router";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineAdminEntity } from "../src/admin-data-adapter.js";
import { useAdminEntityCommands } from "../src/admin-entity-commands.js";
import type {
  AdminEntityAction,
  AdminManagedAction,
} from "../src/admin-entity-model.js";
import { adminSelectionAtom } from "../src/admin-entity-model.js";
import {
  createAdminApplication,
  AdminApplicationProvider,
} from "../src/admin-entity-routing.js";
import type { AdminApplication } from "../src/admin-entity-routing.js";

let commands: ReturnType<typeof useAdminEntityCommands> | null = null;
const Root = () => {
  const catalog = useAdminEntityCommands();
  useEffect(() => {
    commands = catalog;
  });
  return <Outlet />;
};
const apps: AdminApplication[] = [];
const execute = vi.fn<AdminManagedAction["execute"]>();
const setup = async (
  operation: Omit<AdminManagedAction, "execute"> = {},
  target: "record" | "selection" = "record",
  available?: AdminEntityAction["isAvailable"]
) => {
  const entity = defineAdminEntity({
    actions: [
      {
        id: "archive",
        label: () => "Archive",
        operation: { ...operation, execute },
        target,
        ...(available ? { isAvailable: available } : {}),
      },
    ],
    adapter: {
      list: () =>
        Promise.resolve({
          items: [
            { id: "1", label: "First" },
            { id: "2", label: "Second" },
          ],
          total: 2,
        }),
    },
    key: "documents",
    label: "Documents",
    parseValues: (v: unknown) => v,
    reference: (r: { id: string; label: string }) => r,
    singularLabel: "Document",
  });
  const app = createAdminApplication({
    Root,
    entities: [entity],
    history: createMemoryHistory({ initialEntries: ["/documents"] }),
  });
  apps.push(app);
  await app.router.load();
  render(<AdminApplicationProvider application={app} />);
  await screen.findByText("First");
  return app;
};
const open = async () => {
  await act(async () => {
    await commands
      ?.forRecord("1")
      .find((command) => command.id.includes(".action.archive."))
      ?.execute();
  });
};
describe("managed registered actions", () => {
  beforeEach(() => {
    execute.mockResolvedValue({});
    vi.spyOn(window, "scrollTo").mockReturnValue();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn<() => void>();
        unobserve = vi.fn<() => void>();
        disconnect = vi.fn<() => void>();
      }
    );
  });
  afterEach(() => {
    cleanup();
    for (const app of apps.splice(0)) {
      app.dispose();
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    execute.mockReset();
    commands = null;
  });

  it("confirms captured targets, validates input and retains it on failure", async () => {
    execute.mockRejectedValueOnce(new Error("transport diagnostics"));
    await setup({
      confirm: () => "Archive selected documents?",
      input: { fields: [{ key: "reason", label: "Reason", required: true }] },
    });
    await open();
    const user = userEvent.setup();
    const dialog = await screen.findByRole("dialog");
    expect(execute).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Archive" }));
    expect(execute).not.toHaveBeenCalled();
    await user.type(
      within(dialog).getByRole("textbox", { name: "Reason" }),
      "Outdated"
    );
    await user.click(within(dialog).getByRole("button", { name: "Archive" }));
    await screen.findByRole("alert");
    expect(screen.queryByText("transport diagnostics")).toBeNull();
    await user.click(within(dialog).getByRole("button", { name: "Archive" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(
      execute.mock.calls.map((call) => ({ ids: call[0].ids, values: call[1] }))
    ).toStrictEqual([
      { ids: ["1"], values: { reason: "Outdated" } },
      { ids: ["1"], values: { reason: "Outdated" } },
    ]);
  });

  it("focuses a mapped server error after action inputs are re-enabled", async () => {
    const { promise, reject } = Promise.withResolvers<{ message: string }>();
    execute.mockReturnValueOnce(promise);
    await setup({
      input: {
        errors: () => ({ reason: "Choose another reason" }),
        fields: [{ key: "reason", label: "Reason" }],
      },
    });
    await open();
    const user = userEvent.setup();
    const reason = await screen.findByRole("textbox", { name: "Reason" });
    await user.type(reason, "Draft");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Archive",
      })
    );
    await waitFor(() =>
      expect((reason as HTMLInputElement).disabled).toBeTruthy()
    );
    act(() => reject(new Error("conflict")));
    await screen.findByText("Choose another reason");
    await waitFor(() => expect(document.activeElement).toBe(reason));
    expect((reason as HTMLInputElement).disabled).toBeFalsy();
    expect((reason as HTMLInputElement).value).toBe("Draft");
  });

  it("revalidates availability at confirmation without calling transport", async () => {
    let available = true;
    await setup({ confirm: () => "Confirm?" }, "record", () => available);
    await open();
    available = false;
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Archive" })
    );
    expect(execute).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it.each(["reason", "constructor", "nested.value"])(
    "rejects duplicate or unsafe managed-input key %s at registration",
    async (key) => {
      await expect(
        setup({
          input: {
            fields: [
              { key: "reason", label: "Reason" },
              { key, label: "Other" },
            ],
          },
        })
      ).rejects.toThrow(/Invalid or duplicate field/u);
    }
  );

  it("runs immediate actions without an extra confirmation", async () => {
    await setup();
    await open();
    await waitFor(() => expect(execute).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("reports partial success and retries only failed captured IDs", async () => {
    execute.mockResolvedValueOnce({
      failedIds: ["2"],
      message: "One document could not be archived",
    });
    const app = await setup({ confirm: () => "Confirm?" }, "selection");
    act(() =>
      app.store.set(adminSelectionAtom, {
        entity: "documents",
        ids: ["1", "2"],
      })
    );
    await waitFor(() =>
      expect(
        commands?.selectionCommands.some((command) =>
          command.id.includes(".action.archive.")
        )
      ).toBeTruthy()
    );
    await act(async () => {
      await commands?.selectionCommands
        .find((command) => command.id.includes(".action.archive."))
        ?.execute();
    });
    const user = userEvent.setup();
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Archive",
      })
    );
    await expect(
      screen.findByText("One document could not be archived")
    ).resolves.toBeTruthy();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Archive",
      })
    );
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    expect(execute.mock.calls.map((call) => call[0].ids)).toStrictEqual([
      ["1", "2"],
      ["2"],
    ]);
  });

  it("aborts operations on pause and fences late feedback", async () => {
    const gate = Promise.withResolvers<{ message: string }>();
    execute.mockReturnValue(gate.promise);
    const app = await setup();
    await open();
    await waitFor(() => expect(execute).toHaveBeenCalledOnce());
    const signal = execute.mock.calls[0]?.[2].signal;
    act(() => app.pause());
    expect(signal?.aborted).toBeTruthy();
    await act(async () => {
      gate.resolve({ message: "Late result" });
      await gate.promise;
    });
    expect(screen.queryByText("Late result")).toBeNull();
    expect(app.session.diagnostics().pendingRequests).toBe(0);
  });

  it("fences an abort-ignoring transport after close and reopening", async () => {
    const obsolete = Promise.withResolvers<{ message: string }>();
    const current = Promise.withResolvers<{ message: string }>();
    execute
      .mockReturnValueOnce(obsolete.promise)
      .mockReturnValueOnce(current.promise);
    const app = await setup();
    await open();
    await waitFor(() => expect(execute).toHaveBeenCalledOnce());
    const signal = execute.mock.calls[0]?.[2].signal;
    await userEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Cancel",
      })
    );
    expect(signal?.aborted).toBeTruthy();
    await open();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    await act(async () => {
      obsolete.resolve({ message: "Obsolete result" });
      await obsolete.promise;
    });
    expect({
      obsolete: screen.queryByText("Obsolete result"),
      pending: app.session.diagnostics().pendingRequests,
    }).toStrictEqual({ obsolete: null, pending: 1 });
    await act(async () => {
      current.resolve({ message: "Current result" });
      await current.promise;
    });
    await expect(screen.findByText("Current result")).resolves.toBeTruthy();
  });

  it("executes once when duplicate submissions await asynchronous validation", async () => {
    const validation = Promise.withResolvers<{
      errors: Record<string, never>;
      values: { reason: string };
    }>();
    const transport = Promise.withResolvers<{ message: string }>();
    const resolver = vi
      .fn<NonNullable<NonNullable<AdminManagedAction["input"]>["resolver"]>>()
      .mockReturnValue(validation.promise);
    execute.mockReturnValueOnce(transport.promise);
    await setup({
      input: { fields: [{ key: "reason", label: "Reason" }], resolver },
    });
    await open();
    const dialog = await screen.findByRole("dialog");
    const form = dialog.querySelector("form");
    if (!form) {
      throw new Error("Missing action form");
    }
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(resolver).toHaveBeenCalledTimes(2));
    expect(execute).not.toHaveBeenCalled();
    await act(async () => {
      validation.resolve({ errors: {}, values: { reason: "Validated" } });
      await validation.promise;
    });
    await waitFor(() => expect(execute).toHaveBeenCalledOnce());
    expect(
      within(dialog)
        .getByRole("button", { name: "Archive" })
        .hasAttribute("disabled")
    ).toBeTruthy();
    await act(async () => {
      transport.resolve({ message: "Completed" });
      await transport.promise;
    });
    expect(execute.mock.calls.map((call) => call[1])).toStrictEqual([
      { reason: "Validated" },
    ]);
  });

  it("deduplicates public session operations and releases locks after completion", async () => {
    const app = await setup();
    const gate = Promise.withResolvers<number>();
    const callback = vi.fn<() => Promise<number>>(() => gate.promise);
    const pending = app.session.execute("documents", "reindex", callback);
    await expect(
      app.session.execute("documents", "reindex", callback)
    ).rejects.toThrow(/already pending/u);
    expect(callback).toHaveBeenCalledOnce();
    await act(async () => {
      gate.resolve(1);
      await pending;
    });
    await act(async () => {
      await app.session.execute("documents", "reindex", callback);
    });
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
