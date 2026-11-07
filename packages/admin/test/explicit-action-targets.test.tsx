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
import { atom } from "jotai";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineAdminEntity } from "../src/admin-data-adapter.js";
import { useAdminEntityCommands } from "../src/admin-entity-commands.js";
import type {
  AdminCommand,
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
const legacy = vi.fn<() => void>();
const enabled = atom(true);
const first = "a,1";
const second = 'b"]';
const setup = async (operation: Omit<AdminManagedAction, "execute"> = {}) => {
  const state = { available: true, ids: [first, second, "other"], reads: 0 };
  const entity = defineAdminEntity({
    actions: [
      {
        enabled,
        id: "archive",
        isAvailable: () => state.available,
        label: () => "Archive group",
        operation: {
          confirm: (scope) => scope.ids.join(" / "),
          ...operation,
          execute,
        },
        target: "selection",
      },
      {
        execute: legacy,
        id: "legacy",
        label: () => "Legacy",
        target: "selection",
      },
      {
        id: "single",
        label: () => "Single",
        operation: { execute },
        target: "record",
      },
    ],
    adapter: {
      list: () => {
        state.reads += 1;
        return Promise.resolve({
          items: state.ids.map((id) => ({ id, label: id })),
          total: state.ids.length,
        });
      },
    },
    key: "documents",
    label: "Documents",
    parseValues: (value: unknown) => value,
    reference: (record: { id: string; label: string }) => record,
    singularLabel: "Document",
  });
  const app = createAdminApplication({
    Root,
    entities: [entity, { ...entity, key: "others" }],
    history: createMemoryHistory({ initialEntries: ["/documents"] }),
  });
  apps.push(app);
  await app.router.load();
  render(<AdminApplicationProvider application={app} />);
  await screen.findByText(first);
  act(() =>
    app.store.set(adminSelectionAtom, { entity: "documents", ids: ["other"] })
  );
  return { app, state };
};
const explicit = (ids = [first, second]): AdminCommand => {
  const result = commands?.forRecords(ids);
  expect(result).toHaveLength(1);
  if (!result?.[0]) {
    throw new Error("Missing explicit action");
  }
  return result[0];
};
const open = async (command = explicit()) => {
  await act(async () => {
    await command.execute();
  });
  return await screen.findByRole("dialog");
};
const submit = async () => {
  await userEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Archive group",
    })
  );
};
const cancel = async () => {
  await userEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" })
  );
};

describe("explicit-target managed commands", () => {
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
    legacy.mockReset();
    commands = null;
  });

  it("captures a copied canonical subset, validates a draft, and retries only failed IDs without changing selection", async () => {
    execute.mockResolvedValueOnce({
      failedIds: [second],
      message: "One failed",
    });
    const { app } = await setup({
      input: { fields: [{ key: "reason", label: "Reason", required: true }] },
    });
    const ids = [second, first];
    const command = explicit(ids);
    ids.splice(0, ids.length, "other");
    await open(command);
    await submit();
    expect(execute).not.toHaveBeenCalled();
    await userEvent.type(
      screen.getByRole("textbox", { name: "Reason" }),
      "Archived"
    );
    await submit();
    await screen.findByText("One failed");
    expect(app.store.get(adminSelectionAtom)?.ids).toStrictEqual(["other"]);
    act(() =>
      app.store.set(adminSelectionAtom, { entity: "documents", ids: [first] })
    );
    await submit();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(
      execute.mock.calls.map(([scope, values]) => ({ ids: scope.ids, values }))
    ).toStrictEqual([
      { ids: [first, second], values: { reason: "Archived" } },
      { ids: [second], values: { reason: "Archived" } },
    ]);
    expect(app.store.get(adminSelectionAtom)?.ids).toStrictEqual([first]);
    expect(legacy).not.toHaveBeenCalled();
  });

  it.each([
    [],
    [first, first],
    [first, "missing"],
    ["create"],
    [""],
    [first, second, "other", "extra"],
  ])("rejects the complete invalid target set %j", async (...ids) => {
    await setup();
    expect(commands?.forRecords(ids)).toStrictEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });

  it("keeps IDs distinct from native selection commands and does not depend on selection at confirmation", async () => {
    const { app } = await setup();
    act(() =>
      app.store.set(adminSelectionAtom, {
        entity: "documents",
        ids: [first, second],
      })
    );
    const command = explicit();
    const selected = commands?.selectionCommands.find(
      (item) => item.label === "Archive group"
    );
    expect(selected).toBeDefined();
    expect(command.id).not.toBe(selected?.id);
    act(() => app.store.set(adminSelectionAtom, null));
    await open(command);
    await submit();
    await waitFor(() => expect(execute).toHaveBeenCalledOnce());
    expect(execute.mock.calls[0]?.[0].ids).toStrictEqual([first, second]);
    expect(app.store.get(adminSelectionAtom)).toBeNull();
  });

  it.each(["enabled", "availability"])(
    "rechecks %s before opening and confirming",
    async (permission) => {
      const { app, state } = await setup();
      const toggle = (value: boolean) => {
        if (permission === "enabled") {
          act(() => app.store.set(enabled, value));
        } else {
          state.available = value;
        }
      };
      const command = explicit();
      toggle(false);
      await act(async () => {
        await command.execute();
      });
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(commands?.forRecords([first, second])).toStrictEqual([]);
      toggle(true);
      await open();
      toggle(false);
      await submit();
      expect(execute).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).toBeNull();
    }
  );

  it("rejects retained commands and factories after refresh, even when IDs are unchanged", async () => {
    const { app } = await setup();
    const retained = explicit();
    const factory = commands?.forRecords;
    await act(async () => {
      await app.session.refresh();
    });
    await act(async () => {
      await retained.execute();
      await factory?.([first, second])[0]?.execute();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    await open();
    await submit();
    await waitFor(() => expect(execute).toHaveBeenCalledOnce());
  });

  it("does not revive old commands after leaving and returning to the same route", async () => {
    const { app, state } = await setup();
    const original = app.store.get(app.session.snapshotAtom);
    const retained = explicit();
    await act(async () => {
      await app.router.navigate({ to: "/others" });
    });
    await act(async () => {
      await app.router.navigate({ to: "/documents" });
    });
    expect(state.reads).toBe(2);
    const restored = app.store.get(app.session.snapshotAtom);
    expect({
      freshPresentation: restored !== original,
      immutable: Object.isFrozen(restored),
      reusedRecords: restored.items === original.items,
    }).toStrictEqual({
      freshPresentation: true,
      immutable: true,
      reusedRecords: true,
    });
    await act(async () => {
      await retained.execute();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(execute).not.toHaveBeenCalled();
  });

  it("refuses confirmation if any captured record has disappeared", async () => {
    const { app, state } = await setup();
    await open();
    state.ids = [first, "other"];
    await act(async () => {
      await app.session.refresh();
    });
    await submit();
    expect(execute).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("rejects failed IDs outside the captured group without changing selection", async () => {
    execute.mockResolvedValueOnce({ failedIds: ["other"] });
    const { app } = await setup();
    await open();
    await submit();
    await screen.findByText("Command failed. Try again.");
    expect(app.store.get(adminSelectionAtom)?.ids).toStrictEqual(["other"]);
    expect(execute.mock.calls[0]?.[0].ids).toStrictEqual([first, second]);
  });

  it("rechecks availability before retrying failed explicit targets", async () => {
    execute.mockResolvedValueOnce({
      failedIds: [second],
      message: "Retry needed",
    });
    const { app, state } = await setup();
    await open();
    await submit();
    await screen.findByText("Retry needed");
    state.available = false;
    await submit();
    expect(execute).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(app.store.get(adminSelectionAtom)?.ids).toStrictEqual(["other"]);
  });

  it("executes once when duplicate explicit submissions await async validation", async () => {
    const validation = Promise.withResolvers<{
      errors: Record<string, never>;
      values: { reason: string };
    }>();
    const transport = Promise.withResolvers<{ message: string }>();
    execute.mockReturnValueOnce(transport.promise);
    const resolver = vi
      .fn<NonNullable<NonNullable<AdminManagedAction["input"]>["resolver"]>>()
      .mockReturnValue(validation.promise);
    const { app } = await setup({
      input: { fields: [{ key: "reason", label: "Reason" }], resolver },
    });
    const dialog = await open();
    const form = dialog.querySelector("form");
    if (!form) {
      throw new Error("Missing form");
    }
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(resolver).toHaveBeenCalledTimes(2));
    await act(async () => {
      validation.resolve({ errors: {}, values: { reason: "Validated" } });
      await validation.promise;
    });
    await waitFor(() => expect(execute).toHaveBeenCalledOnce());
    expect(app.session.diagnostics().pendingRequests).toBe(1);
    expect(
      within(dialog)
        .getByRole("button", { name: "Archive group" })
        .hasAttribute("disabled")
    ).toBeTruthy();
    await act(async () => {
      transport.resolve({ message: "Completed" });
      await transport.promise;
    });
    await screen.findByText("Completed");
    expect(
      execute.mock.calls.map(([scope, values]) => ({ ids: scope.ids, values }))
    ).toStrictEqual([
      { ids: [first, second], values: { reason: "Validated" } },
    ]);
    expect(app.store.get(adminSelectionAtom)?.ids).toStrictEqual(["other"]);
  });

  it("fences duplicate late validations after cancellation", async () => {
    const validation = Promise.withResolvers<{
      errors: Record<string, never>;
      values: { reason: string };
    }>();
    const resolver = vi
      .fn<NonNullable<NonNullable<AdminManagedAction["input"]>["resolver"]>>()
      .mockReturnValue(validation.promise);
    await setup({
      input: { fields: [{ key: "reason", label: "Reason" }], resolver },
    });
    const dialog = await open();
    const form = dialog.querySelector("form");
    if (!form) {
      throw new Error("Missing form");
    }
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(resolver).toHaveBeenCalledTimes(2));
    await cancel();
    await open();
    await act(async () => {
      validation.resolve({ errors: {}, values: { reason: "Late" } });
      await validation.promise;
    });
    expect(execute).not.toHaveBeenCalled();
    expect(
      (screen.getByRole("textbox", { name: "Reason" }) as HTMLInputElement)
        .value
    ).toBe("");
  });

  it.each(["cancel", "pause", "dispose", "navigate"])(
    "aborts pending operations on %s and fences late feedback",
    async (ending) => {
      const gate = Promise.withResolvers<{
        message: string;
        failedIds: string[];
      }>();
      execute.mockReturnValueOnce(gate.promise);
      const { app } = await setup();
      await open();
      await submit();
      await waitFor(() => expect(execute).toHaveBeenCalledOnce());
      const signal = execute.mock.calls[0]?.[2].signal;
      if (ending === "cancel") {
        await cancel();
      } else if (ending === "navigate") {
        await act(async () => {
          await app.router.navigate({ to: "/others" });
        });
      } else {
        act(() => {
          if (ending === "pause") {
            app.pause();
          } else {
            app.dispose();
          }
        });
      }
      await waitFor(() => expect(signal?.aborted).toBeTruthy());
      await act(async () => {
        gate.resolve({ failedIds: [second], message: "Late feedback" });
        await gate.promise;
      });
      expect(screen.queryByText("Late feedback")).toBeNull();
      expect(app.session.diagnostics().pendingRequests).toBe(0);
      expect(app.store.get(adminSelectionAtom)?.ids).not.toStrictEqual([
        second,
      ]);
    }
  );
});
