import { createMemoryHistory, Outlet } from "@tanstack/react-router";
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineAdminEntity } from "../src/admin-data-adapter.js";
import type {
  AdminMutationScope,
  AdminMutationRequest,
} from "../src/admin-data-adapter.js";
import { useAdminEntityCommands } from "../src/admin-entity-commands.js";
import { useAdminEntityContext } from "../src/admin-entity-context.js";
import {
  AdminApplicationProvider,
  createAdminApplication,
} from "../src/admin-entity-routing.js";
import type { AdminApplication } from "../src/admin-entity-routing.js";
import { useAdminFormLifetime } from "../src/admin-form-lifetime.js";

let commands: ReturnType<typeof useAdminEntityCommands> | undefined;
let context: ReturnType<typeof useAdminEntityContext> | undefined;
const applications: AdminApplication[] = [];
const Observer = () => {
  const current = useAdminEntityCommands();
  const currentContext = useAdminEntityContext();
  useEffect(() => {
    commands = current;
    context = currentContext;
  });
  return null;
};
const Root = () => (
  <>
    <Observer />
    <Outlet />
  </>
);
const NotFound = () => <h1>Unavailable</h1>;
const fixture = (path: string, creation = true) => {
  let writer = true;
  let revision = "1";
  let updateHint = true;
  let allowCreation = creation;
  const projection = (id: string) => ({
    editable: id === "writer" && writer,
    id,
    revision,
    title: id === "writer" ? "Writer" : "Reader",
  });
  type Projection = ReturnType<typeof projection>;
  const create = vi.fn<(values: unknown) => Promise<Projection>>((_values) =>
    Promise.resolve(projection("writer"))
  );
  const update = vi.fn<
    (
      id: string,
      values: unknown,
      request: AdminMutationRequest
    ) => Promise<Projection>
  >((id, _values) => Promise.resolve(projection(id)));
  const get = vi.fn<(id: string) => Promise<Projection | null>>((id) =>
    Promise.resolve(["writer", "reader"].includes(id) ? projection(id) : null)
  );
  const available = ({ view, record }: AdminMutationScope) =>
    view === "create"
      ? allowCreation
      : updateHint &&
        !!record &&
        typeof record.data === "object" &&
        record.data !== null &&
        "editable" in record.data &&
        record.data.editable === true;
  const entity = defineAdminEntity({
    adapter: {
      create,
      get,
      list: () =>
        Promise.resolve({
          items: [projection("reader"), projection("writer")],
          total: 2,
        }),
      update,
    },
    form: {
      defaultValues: { title: "" },
      fields: [{ key: "title", label: "Title", required: true }],
    },
    isMutationAvailable: available,
    key: "records",
    label: "Records",
    parseValues: (values: unknown) => values,
    reference: (record) => ({ id: record.id, label: record.title }),
    singularLabel: "Record",
  });
  const app = createAdminApplication({
    NotFound,
    Root,
    entities: [entity],
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  applications.push(app);
  return {
    advanceRevision: () => {
      revision = "2";
    },
    allowCreation: () => {
      allowCreation = true;
    },
    allowWriter: () => {
      writer = true;
    },
    app,
    create,
    denyCreation: () => {
      allowCreation = false;
    },
    denyUpdateHint: () => {
      updateHint = false;
    },
    denyWriter: () => {
      writer = false;
    },
    get,
    update,
  };
};
const mount = async (app: AdminApplication) => {
  await act(async () => {
    await app.router.load();
  });
  render(<AdminApplicationProvider application={app} />);
};
const currentCommands = () => {
  if (!commands) {
    throw new Error("Command observer not mounted.");
  }
  return commands;
};
const saveCommand = () => {
  const save = currentCommands().pageCommands.find(
    (command) => command.id === "records.save"
  );
  if (!save) {
    throw new Error("Save command not registered.");
  }
  return save;
};
describe("stock mutation availability and edit origins", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn<() => void>();
        unobserve = vi.fn<() => void>();
        disconnect = vi.fn<() => void>();
      }
    );
    vi.spyOn(window, "scrollTo").mockReturnValue();
  });
  afterEach(() => {
    cleanup();
    for (const app of applications.splice(0)) {
      app.dispose();
    }
    commands = undefined;
    context = undefined;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses current detached record flags for stock row Edit and palette parity", async () => {
    const { app } = fixture("/records");
    await mount(app);
    await screen.findByRole("heading", { name: "Records" });
    expect({
      reader: currentCommands()
        .forRecord("reader")
        .some((command) => command.location?.view === "update"),
      writer: currentCommands()
        .forRecord("writer")
        .some((command) => command.location?.view === "update"),
    }).toStrictEqual({ reader: false, writer: true });
    expect(
      currentCommands()
        .paletteCommands.filter(
          (command) => command.location?.view === "update"
        )
        .map((command) => command.id)
    ).toStrictEqual(["records.record.writer.update"]);
  });

  it("shows stock Edit only for a writable authoritative detail", async () => {
    const { app } = fixture("/records/reader");
    const user = userEvent.setup();
    await mount(app);
    await screen.findByRole("heading", { name: "Reader" });
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await screen.findByRole("menu");
    expect({
      commandEdit: currentCommands()
        .forRecord("reader")
        .some((command) => command.location?.view === "update"),
      menuEdit: screen.queryByRole("menuitem", { name: "Edit" }),
    }).toStrictEqual({ commandEdit: false, menuEdit: null });
    await user.keyboard("{Escape}");
    await act(async () => {
      await app.router.navigate({ to: "/records/writer" });
    });
    await user.click(await screen.findByRole("button", { name: "Actions" }));
    await expect(
      screen.findByRole("menuitem", { name: "Edit" })
    ).resolves.toBeTruthy();
  });

  it.each(["reader", "missing"])(
    "direct update does not render mutation fields or Save for %s",
    async (id) => {
      const { app, update } = fixture(`/records/${id}/edit`);
      await mount(app);
      await expect(
        screen.findByRole("heading", { name: "Unavailable" })
      ).resolves.toBeTruthy();
      expect(screen.queryByRole("textbox", { name: "Title" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
      expect(update).not.toHaveBeenCalled();
    }
  );

  it("checks stock Create at idle create scope and restores it from a fresh active scope", async () => {
    const { app, get, create, allowCreation } = fixture(
      "/records/create",
      false
    );
    await mount(app);
    await expect(
      screen.findByRole("heading", { name: "Unavailable" })
    ).resolves.toBeTruthy();
    expect({
      create: currentCommands().create,
      hasCommand: currentCommands().navigationCommands.some(
        (command) => command.id === "records.create"
      ),
      reads: get.mock.calls.length,
    }).toStrictEqual({ create: null, hasCommand: false, reads: 0 });
    allowCreation();
    await act(async () => {
      await app.router.invalidate();
    });
    await expect(
      screen.findByRole("textbox", { name: "Title" })
    ).resolves.toBeTruthy();
    await userEvent
      .setup()
      .type(screen.getByRole("textbox", { name: "Title" }), "Created");
    await userEvent.setup().click(screen.getByRole("button", { name: "Save" }));
    expect(create).toHaveBeenCalledOnce();
  });

  it.each(["/records", "/records/writer", "/records/create"])(
    "does not advertise freshly rebuilt stock Create after pause at %s",
    async (path) => {
      const { app, create } = fixture(path);
      await mount(app);
      expect(currentCommands().create?.id).toBe("records.create");
      await act(() => {
        app.pause();
      });
      expect({
        button: screen.queryByRole("button", { name: "Create record" }),
        create: currentCommands().create,
        navigation: currentCommands().navigationCommands.some(
          (command) => command.id === "records.create"
        ),
        palette: currentCommands().paletteCommands.some(
          (command) => command.id === "records.create"
        ),
      }).toStrictEqual({
        button: null,
        create: null,
        navigation: false,
        palette: false,
      });
      expect(create).not.toHaveBeenCalled();
    }
  );

  it("cannot navigate with a freshly rebuilt paused Create command", async () => {
    const { app } = fixture("/records");
    await mount(app);
    await act(() => {
      app.pause();
    });
    const paused = currentCommands().create;
    await act(async () => {
      await paused?.execute();
    });
    expect(app.router.state.location.pathname).toBe("/records");
  });

  it.each(["/records", "/records/writer"])(
    "restores Create only in a reactivated keyed scope at %s",
    async (path) => {
      const { app } = fixture(path);
      await mount(app);
      const prior = currentCommands().create;
      if (!prior) {
        throw new Error("Missing active Create.");
      }
      await act(async () => {
        app.pause();
        await prior.execute();
      });
      expect(app.router.state.location.pathname).toBe(path);
      await act(async () => {
        app.connect();
        await app.router.invalidate();
      });
      const fresh = currentCommands().create;
      if (!fresh) {
        throw new Error("Missing reactivated Create.");
      }
      expect(app.store.get(app.session.snapshotAtom).key).not.toBe("");
      await act(async () => {
        await fresh.execute();
      });
      expect(app.router.state.location.pathname).toBe("/records/create");
      await expect(
        screen.findByRole("textbox", { name: "Title" })
      ).resolves.toBeTruthy();
    }
  );

  it("rejects retained Edit after policy refresh and restores only from fresh detail", async () => {
    const { app, denyWriter, allowWriter, get } = fixture("/records/writer");
    const user = userEvent.setup();
    await mount(app);
    await user.click(await screen.findByRole("button", { name: "Actions" }));
    await screen.findByRole("menuitem", { name: "Edit" });
    await user.keyboard("{Escape}");
    const edit = currentCommands()
      .forRecord("writer")
      .find((command) => command.location?.view === "update");
    if (!edit) {
      throw new Error("Missing Edit.");
    }
    denyWriter();
    await act(async () => {
      await app.session.refresh();
    });
    await act(async () => {
      await edit.execute();
    });
    expect(app.router.state.location.pathname).toBe("/records/writer");
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await screen.findByRole("menu");
    expect({
      commandEdit: currentCommands()
        .forRecord("writer")
        .some((command) => command.location?.view === "update"),
      menuEdit: screen.queryByRole("menuitem", { name: "Edit" }),
    }).toStrictEqual({ commandEdit: false, menuEdit: null });
    await user.keyboard("{Escape}");
    allowWriter();
    await act(async () => {
      await app.session.refresh();
    });
    await user.click(await screen.findByRole("button", { name: "Actions" }));
    await expect(
      screen.findByRole("menuitem", { name: "Edit" })
    ).resolves.toBeTruthy();
    expect(get).toHaveBeenCalledTimes(3);
  });

  it("rejects retained Edit after pause", async () => {
    const { app } = fixture("/records/writer");
    const user = userEvent.setup();
    await mount(app);
    await user.click(await screen.findByRole("button", { name: "Actions" }));
    await screen.findByRole("menuitem", { name: "Edit" });
    await user.keyboard("{Escape}");
    const edit = currentCommands()
      .forRecord("writer")
      .find((command) => command.location?.view === "update");
    if (!edit) {
      throw new Error("Missing Edit.");
    }
    await act(async () => {
      app.pause();
      await edit.execute();
    });
    expect(app.router.state.location.pathname).toBe("/records/writer");
  });

  it("hides existing update fields and rejects retained Save/field inputs after policy loss", async () => {
    const { app, denyWriter, update } = fixture("/records/writer/edit");
    await mount(app);
    await screen.findByRole("textbox", { name: "Title" });
    const saved = currentCommands().pageCommands;
    denyWriter();
    await act(async () => {
      await app.session.refresh();
    });
    await expect(
      screen.findByRole("heading", { name: "Unavailable" })
    ).resolves.toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Title" })).toBeNull();
    await act(async () => {
      await Promise.all(
        saved.map((command) =>
          command.id === "records.save"
            ? command.execute()
            : command.input?.execute("Blocked")
        )
      );
    });
    expect(update).not.toHaveBeenCalled();
  });

  it.each(["create", "update"] as const)(
    "rechecks %s after RHF validation yields and session pauses",
    async (view) => {
      const { app, create, update } = fixture(
        view === "create" ? "/records/create" : "/records/writer/edit"
      );
      await mount(app);
      await screen.findByRole("textbox", { name: "Title" });
      if (view === "create") {
        await userEvent
          .setup()
          .type(screen.getByRole("textbox", { name: "Title" }), "Created");
      }
      const save = saveCommand();
      await act(async () => {
        const pending = save.execute();
        app.pause();
        await pending;
      });
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(screen.queryByRole("textbox", { name: "Title" })).toBeNull();
    }
  );

  it("rechecks retained stock Create against the latest callback before navigation", async () => {
    const { app, denyCreation } = fixture("/records");
    await mount(app);
    const creation = currentCommands().create;
    if (!creation) {
      throw new Error("Missing Create.");
    }
    denyCreation();
    await act(async () => {
      await creation.execute();
    });
    expect(app.router.state.location.pathname).toBe("/records");
  });

  it("rechecks retained Edit and form commands when the callback denies without a render", async () => {
    const { app, denyUpdateHint, update } = fixture("/records/writer/edit");
    await mount(app);
    await screen.findByRole("textbox", { name: "Title" });
    const saved = currentCommands().pageCommands;
    denyUpdateHint();
    await act(async () => {
      await Promise.all(
        saved.map((command) => {
          if (command.input) {
            return command.input.execute("Blocked");
          }
          if (command.id === "records.save") {
            return command.execute();
          }
          return null;
        })
      );
    });
    expect(
      (screen.getByRole("textbox", { name: "Title" }) as HTMLInputElement).value
    ).toBe("Writer");
    expect(update).not.toHaveBeenCalled();
  });

  it("retains loading presentation until a fresh update read completes", async () => {
    const { app, get } = fixture("/records/writer/edit");
    await mount(app);
    await screen.findByRole("textbox", { name: "Title" });
    const gate = Promise.withResolvers<{
      id: string;
      title: string;
      editable: boolean;
      revision: string;
    }>();
    get.mockReturnValueOnce(gate.promise);
    let refreshing: Promise<void> | undefined;
    act(() => {
      refreshing = app.session.refresh();
    });
    await expect(
      screen.findByLabelText("Loading records…")
    ).resolves.toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Unavailable" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Title" })).toBeNull();
    await act(async () => {
      gate.resolve({
        editable: true,
        id: "writer",
        revision: "1",
        title: "Fresh",
      });
      await refreshing;
    });
    expect(
      (
        (await screen.findByRole("textbox", {
          name: "Title",
        })) as HTMLInputElement
      ).value
    ).toBe("Fresh");
  });

  it("preserves recoverable update errors rather than presenting a policy denial", async () => {
    const { app, update } = fixture("/records/writer/edit");
    update.mockRejectedValueOnce(new Error("Conflict"));
    await mount(app);
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "Save" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Could not save.");
    expect(screen.getByRole("textbox", { name: "Title" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  it("rejects yielded old-form Save across pause and same-route reconnect", async () => {
    const { app, update, get } = fixture("/records/writer/edit");
    await mount(app);
    await screen.findByRole("textbox", { name: "Title" });
    const request = context?.request;
    if (!request) {
      throw new Error("Missing active request.");
    }
    const save = saveCommand();
    await act(async () => {
      const pending = save.execute();
      app.pause();
      const reconnect = app.session.activate(request, true);
      await Promise.all([pending, reconnect]);
    });
    expect(update).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledTimes(2);
    await expect(
      screen.findByRole("textbox", { name: "Title" })
    ).resolves.toBeTruthy();
  });

  it("rejects an unmounted form's retained Save on same-route cache return", async () => {
    const { app, update } = fixture("/records/writer/edit");
    await mount(app);
    await screen.findByRole("textbox", { name: "Title" });
    const save = saveCommand();
    await act(async () => {
      await app.router.navigate({ to: "/records" });
    });
    await screen.findByRole("heading", { name: "Records" });
    expect(screen.queryByRole("textbox", { name: "Title" })).toBeNull();
    await act(async () => {
      await app.router.navigate({ to: "/records/writer/edit" });
      await save.execute();
    });
    expect(update).not.toHaveBeenCalled();
    await expect(
      screen.findByRole("textbox", { name: "Title" })
    ).resolves.toBeTruthy();
  });

  it("keeps an old form's async lifetime guard false across unmount and remount", async () => {
    const old = renderHook(useAdminFormLifetime);
    const alive = old.result.current;
    const gate = Promise.withResolvers<null>();
    const apply = vi.fn<() => void>();
    const pending = gate.promise.then(() => {
      if (alive()) {
        apply();
      }
    });
    old.unmount();
    const fresh = renderHook(useAdminFormLifetime);
    expect({ fresh: fresh.result.current(), old: alive() }).toStrictEqual({
      fresh: true,
      old: false,
    });
    await act(async () => {
      gate.resolve(null);
      await pending;
    });
    expect(apply).not.toHaveBeenCalled();
    fresh.unmount();
  });

  it("does not navigate a cancelled form when its pending mutation returns late", async () => {
    const { app, update } = fixture("/records/writer/edit");
    const gate = Promise.withResolvers<{
      id: string;
      title: string;
      editable: boolean;
      revision: string;
    }>();
    update.mockReturnValueOnce(gate.promise);
    await mount(app);
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "Save" }));
    await waitFor(() => expect(update).toHaveBeenCalledOnce());
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Cancel" }));
    await screen.findByRole("heading", { name: "Records" });
    await act(() => {
      gate.resolve({
        editable: true,
        id: "writer",
        revision: "2",
        title: "Late",
      });
    });
    expect(app.router.state.location.pathname).toBe("/records");
    expect(screen.getByRole("heading", { name: "Records" })).toBeTruthy();
  });

  it("forwards the detached edit origin without a visible revision field or read-on-save", async () => {
    const { app, update, get, advanceRevision } = fixture(
      "/records/writer/edit"
    );
    await mount(app);
    const title = await screen.findByRole("textbox", { name: "Title" });
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(get).toHaveBeenCalledOnce();
    advanceRevision();
    await userEvent.setup().clear(title);
    await userEvent.setup().type(title, "Edited Writer");
    await userEvent.setup().click(screen.getByRole("button", { name: "Save" }));
    expect(update).toHaveBeenCalledWith(
      "writer",
      { title: "Edited Writer" },
      expect.objectContaining({
        initialRecord: {
          editable: true,
          id: "writer",
          revision: "1",
          title: "Writer",
        },
      })
    );
  });

  it("legacy programmatic updates omit the optional edit-origin property", async () => {
    const { app, update } = fixture("/records/writer");
    await mount(app);
    await screen.findByRole("heading", { name: "Writer" });
    await act(async () => {
      await app.session.update("records", "writer", { title: "Plain" });
    });
    expect(update).toHaveBeenCalledWith(
      "writer",
      { title: "Plain" },
      expect.not.objectContaining({ initialRecord: expect.anything() })
    );
    expect(
      Object.keys(update.mock.calls[0]?.[2] ?? {}).toSorted()
    ).toStrictEqual(["signal"]);
  });

  it("freshly opened update forms capture the newly authoritative starting record", async () => {
    const { app, update, advanceRevision } = fixture("/records/writer/edit");
    await mount(app);
    await screen.findByRole("textbox", { name: "Title" });
    advanceRevision();
    app.session.invalidate("records");
    await act(async () => {
      await app.router.navigate({ to: "/records/writer" });
    });
    // A real unmount/reopen, not a batched same-form hint refresh.
    await screen.findByRole("heading", { name: "Writer" });
    expect(screen.queryByRole("textbox", { name: "Title" })).toBeNull();
    await act(async () => {
      await app.router.navigate({ to: "/records/writer/edit" });
    });
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "Save" }));
    expect(update).toHaveBeenCalledWith(
      "writer",
      { title: "Writer" },
      expect.objectContaining({
        initialRecord: expect.objectContaining({ revision: "2" }),
      })
    );
  });

  it("does not replace mounted-form origin with a newer current hint snapshot", async () => {
    const { app, update, advanceRevision } = fixture("/records/writer/edit");
    await mount(app);
    await screen.findByRole("textbox", { name: "Title" });
    advanceRevision();
    await act(async () => {
      await app.session.refresh();
    });
    expect(
      app.store.get(app.session.snapshotAtom).items[0]?.data
    ).toStrictEqual(expect.objectContaining({ revision: "2" }));
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "Save" }));
    expect(update).toHaveBeenCalledWith(
      "writer",
      { title: "Writer" },
      expect.objectContaining({
        initialRecord: expect.objectContaining({ revision: "1" }),
      })
    );
  });
});
