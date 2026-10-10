import { createMemoryHistory, Outlet } from "@tanstack/react-router";
import {
  act,
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { atom, useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineAdminEntity } from "../src/admin-data-adapter.js";
import type {
  AdminDataAdapter,
  AdminEntityDefinition,
} from "../src/admin-data-adapter.js";
import {
  useAdminEntityCommands,
  useAdminPageCommands,
} from "../src/admin-entity-commands.js";
import { useAdminEntityContext } from "../src/admin-entity-context.js";
import {
  adminPageCommandsAtom,
  adminSelectionAtom,
  createAdminEntityRegistry,
} from "../src/admin-entity-model.js";
import type { AdminCommand } from "../src/admin-entity-model.js";
import {
  AdminApplicationProvider,
  createAdminApplication,
} from "../src/admin-entity-routing.js";
import type { AdminApplication } from "../src/admin-entity-routing.js";

const permissionAtom = atom(true);
const pageVersionAtom = atom(0);
const runAction = vi.fn<() => void>();
const runSave = vi.fn<() => void>();
const captureCommands = vi.fn<(commands: readonly AdminCommand[]) => void>();
const applications: AdminApplication[] = [];
const Commands = () => {
  const { paletteCommands } = useAdminEntityCommands();
  useEffect(() => {
    captureCommands(paletteCommands);
  }, [paletteCommands]);
  return (
    <section aria-label="Commands">
      {paletteCommands.map((command) => (
        <button
          type="button"
          key={command.id}
          onClick={async () => {
            await command.execute();
          }}
        >
          {command.label}
        </button>
      ))}
    </section>
  );
};
const Root = () => (
  <>
    <Commands />
    <main>
      <Outlet />
    </main>
  </>
);
const NotFound = () => <h1>Unavailable</h1>;
const ListScreen = () => <h1>{useAdminEntityContext().entity?.label}</h1>;
const RecordScreen = () => {
  const { entity, recordId, view } = useAdminEntityContext();
  return (
    <h1>
      {entity?.key}:{recordId}:{view}
    </h1>
  );
};
const CreateScreen = () => {
  const key = useAdminEntityContext().entity?.key;
  const commands = useMemo<AdminCommand[]>(
    () => [{ execute: runSave, id: "save", label: `Save ${key}` }],
    [key]
  );
  useAdminPageCommands(commands);
  return <h1>Create {key}</h1>;
};
const VersionedScreen = () => {
  const version = useAtomValue(pageVersionAtom);
  const commands = useMemo<AdminCommand[]>(
    () => [{ execute: runSave, id: "save", label: `Save revision ${version}` }],
    [version]
  );
  useAdminPageCommands(commands);
  return <h1>Versioned screen</h1>;
};
interface ReferenceRecord {
  id: string;
  label: string;
}
const parseValues = (value: unknown) => {
  if (typeof value !== "string") {
    throw new TypeError("Expected label.");
  }
  return value;
};
const fixtureEntities = () => {
  const datasets = new Map<string, ReferenceRecord[]>([
    [
      "books",
      [
        { id: "1", label: "Example" },
        { id: "a/b", label: "Encoded record" },
      ],
    ],
    ["people", [{ id: "1", label: "Example" }]],
  ]);
  const adapter = (key: string): AdminDataAdapter<ReferenceRecord, string> => ({
    create: async (label) => {
      await Promise.resolve();
      return { id: "new", label };
    },
    dispose: () => {
      datasets.clear();
    },
    get: async (id) => {
      await Promise.resolve();
      return datasets.get(key)?.find((record) => record.id === id) ?? null;
    },
    list: async (query) => {
      await Promise.resolve();
      const records = datasets.get(key) ?? [];
      return {
        items: records.slice(
          (query.page - 1) * query.pageSize,
          query.page * query.pageSize
        ),
        total: records.length,
      };
    },
    update: async (id, label) => {
      await Promise.resolve();
      return { id, label };
    },
  });
  const writable = defineAdminEntity({
    actions: [
      {
        enabled: permissionAtom,
        execute: runAction,
        id: "archive",
        label: (scope) => `Archive ${scope.records[0]?.label}`,
        target: "record",
      },
    ],
    adapter: adapter("books"),
    key: "books",
    label: "Books",
    parseValues,
    reference: (record) => record,
    screens: {
      create: CreateScreen,
      detail: RecordScreen,
      list: ListScreen,
      update: RecordScreen,
    },
    singularLabel: "Book",
  });
  const readonly = defineAdminEntity({
    adapter: adapter("people"),
    key: "people",
    label: "People",
    parseValues,
    reference: (record) => record,
    screens: { detail: RecordScreen, list: ListScreen },
    singularLabel: "Person",
  });
  return {
    readonly,
    replace: (key: string, records: ReferenceRecord[]) => {
      datasets.set(key, records);
    },
    writable,
  };
};
const renderApplication = async (
  path = "/books",
  entities?: readonly AdminEntityDefinition[]
) => {
  const fixture = fixtureEntities();
  const application = createAdminApplication({
    NotFound,
    Root,
    entities: entities ?? [fixture.writable, fixture.readonly],
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  applications.push(application);
  render(<AdminApplicationProvider application={application} />);
  await screen.findByRole("heading");
  return {
    application,
    commands: within(screen.getByRole("region", { name: "Commands" })),
    fixture,
    user: userEvent.setup(),
  };
};

describe("entity application", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
    for (const application of applications.splice(0)) {
      application.dispose();
    }
    vi.restoreAllMocks();
  });

  it("derives registered entity navigation from available screens", async () => {
    const { commands, user, application } = await renderApplication();
    expect(
      commands.getAllByRole("button").map((button) => button.textContent)
    ).toStrictEqual(
      expect.arrayContaining(["List books", "Create book", "List people"])
    );
    expect(
      commands.queryByRole("button", { name: "Create person" })
    ).toBeNull();
    await user.click(commands.getByRole("button", { name: "List people" }));
    await screen.findByRole("heading", { name: "People" });
    expect(application.router.state.location.pathname).toBe("/people");
    expect(commands.queryByRole("button", { name: "Edit Example" })).toBeNull();
    expect(
      commands.queryByRole("button", { name: "Archive Example" })
    ).toBeNull();
  });

  it.each(["documents", "constructor"])(
    "supports renamed entity %s without adding routes or palette entries",
    async (key) => {
      const fixture = fixtureEntities();
      const renamed = {
        ...fixture.writable,
        key,
        label: "Documents",
        singularLabel: "Document",
      };
      const { user, commands, application } = await renderApplication(
        `/${key}`,
        [renamed]
      );
      await user.click(commands.getByRole("button", { name: "View Example" }));
      await screen.findByRole("heading", { name: `${key}:1:detail` });
      expect(application.router.state.location.pathname).toBe(`/${key}/1`);
      await user.click(commands.getByRole("button", { name: "Edit Example" }));
      await screen.findByRole("heading", { name: `${key}:1:update` });
      expect(application.router.state.location.pathname).toBe(`/${key}/1/edit`);
    }
  );

  it("uses matched entities and decoded IDs for direct URLs and navigation", async () => {
    const { commands, user, application } =
      await renderApplication("/books/a%2Fb");
    expect(screen.getByRole("heading").textContent).toBe("books:a/b:detail");
    await user.click(
      commands.getByRole("button", { name: "Edit Encoded record" })
    );
    await screen.findByRole("heading", { name: "books:a/b:update" });
    expect(application.router.state.location.pathname).toBe(
      "/books/a%2Fb/edit"
    );
  });

  it("keeps selection entity-scoped even when record IDs collide", async () => {
    const { application, commands, user } = await renderApplication();
    await user.click(commands.getByRole("button", { name: "Select Example" }));
    expect(application.store.get(adminSelectionAtom)).toStrictEqual({
      entity: "books",
      ids: ["1"],
    });
    await user.click(commands.getByRole("button", { name: "List people" }));
    await screen.findByRole("heading", { name: "People" });
    await waitFor(() => {
      expect(application.store.get(adminSelectionAtom)).toBeNull();
    });
    expect(
      commands.getByRole("button", { name: "Select Example" })
    ).toBeDefined();
  });

  it("does not mutate another entity's selection through stale commands", async () => {
    const { application, commands, user } = await renderApplication();
    const staleSelect = captureCommands.mock.lastCall?.[0].find(
      (command) => command.label === "Select Example"
    );
    await user.click(commands.getByRole("button", { name: "Select Example" }));
    const staleClear = captureCommands.mock.lastCall?.[0].find(
      (command) => command.label === "Clear selection"
    );
    await user.click(commands.getByRole("button", { name: "List people" }));
    await screen.findByRole("heading", { name: "People" });
    await user.click(commands.getByRole("button", { name: "Select Example" }));
    await act(async () => {
      await staleSelect?.execute();
      await staleClear?.execute();
    });
    expect(application.store.get(adminSelectionAtom)).toStrictEqual({
      entity: "people",
      ids: ["1"],
    });
  });

  it("registers real screen callbacks and removes them when the screen leaves", async () => {
    const { commands, user, application } =
      await renderApplication("/books/create");
    await user.click(
      await commands.findByRole("button", { name: "Save books" })
    );
    expect(runSave).toHaveBeenCalledOnce();
    const stale = application.store.get(adminPageCommandsAtom)?.commands[0];
    await user.click(commands.getByRole("button", { name: "List people" }));
    await screen.findByRole("heading", { name: "People" });
    expect(commands.queryByRole("button", { name: "Save books" })).toBeNull();
    await stale?.execute();
    expect(runSave).toHaveBeenCalledOnce();
  });

  it("invalidates replaced page callbacks on the same screen", async () => {
    const fixture = fixtureEntities();
    const entity = {
      ...fixture.writable,
      screens: { ...fixture.writable.screens, create: VersionedScreen },
    };
    const { application, commands, user } = await renderApplication(
      "/books/create",
      [entity]
    );
    await commands.findByRole("button", { name: "Save revision 0" });
    const stale = application.store.get(adminPageCommandsAtom)?.commands[0];
    act(() => {
      application.store.set(pageVersionAtom, 1);
    });
    await commands.findByRole("button", { name: "Save revision 1" });
    await stale?.execute();
    expect(runSave).not.toHaveBeenCalled();
    await user.click(commands.getByRole("button", { name: "Save revision 1" }));
    expect(runSave).toHaveBeenCalledOnce();
  });

  it("rechecks permissions and removes stale record actions after adapter refresh", async () => {
    const { commands, application, user, fixture } = await renderApplication();
    await user.click(commands.getByRole("button", { name: "Archive Example" }));
    const stale = captureCommands.mock.lastCall?.[0].find(
      (command) => command.label === "Archive Example"
    );
    act(() => {
      application.store.set(permissionAtom, false);
    });
    expect(
      commands.queryByRole("button", { name: "Archive Example" })
    ).toBeNull();
    await stale?.execute();
    expect(runAction).toHaveBeenCalledOnce();
    fixture.replace("books", []);
    await act(async () => {
      await application.session.refresh();
    });
    expect(commands.queryByRole("button", { name: "View Example" })).toBeNull();
  });

  it.each([
    "/ghost/1",
    "/books/unknown",
    "/people/create",
    "/people/1/edit",
    "/outside/the/entity/route/tree",
  ])("handles unavailable route %s without stale actions", async (path) => {
    const { commands } = await renderApplication(path);
    expect(screen.getByRole("heading", { name: "Unavailable" })).toBeDefined();
    expect(
      commands.queryByRole("button", { name: "Archive Example" })
    ).toBeNull();
    expect(commands.queryByRole("button", { name: "Edit Example" })).toBeNull();
  });

  it("releases application data and subscriptions across repeated mount cycles", async () => {
    const fixture = fixtureEntities();
    const application = createAdminApplication({
      NotFound,
      Root,
      entities: [fixture.writable],
      history: createMemoryHistory({ initialEntries: ["/books"] }),
    });
    applications.push(application);
    for (let cycle = 0; cycle < 5; cycle += 1) {
      const view = render(
        <AdminApplicationProvider application={application} />
      );
      // oxlint-disable-next-line no-await-in-loop -- Mount/dispose cycles must run sequentially against the same application.
      await screen.findByRole("heading", { name: "Books" });
      expect(application.session.diagnostics().activeRecords).toBe(2);
      view.unmount();
      expect(application.session.diagnostics()).toMatchObject({
        activeRecords: 0,
        cacheEntries: 0,
        expiryScheduled: false,
        pendingRequests: 0,
        subscriptions: 0,
      });
      expect(
        application.store.get(application.session.snapshotAtom).items
      ).toStrictEqual([]);
    }
  });

  it("rejects invalid entity and action identities and incompatible adapter capabilities", () => {
    const fixture = fixtureEntities();
    expect(() =>
      createAdminEntityRegistry([fixture.writable, fixture.writable])
    ).toThrow("Duplicate admin entity key");
    expect(() =>
      createAdminEntityRegistry([{ ...fixture.writable, key: "not/a/slug" }])
    ).toThrow("Invalid admin entity key");
    const action = fixture.writable.actions?.[0];
    if (!action) {
      throw new Error("Expected fixture action.");
    }
    expect(() =>
      createAdminEntityRegistry([
        { ...fixture.writable, actions: [action, action] },
      ])
    ).toThrow("Duplicate action");
    expect(() =>
      createAdminEntityRegistry([
        {
          ...fixture.writable,
          adapter: {
            get: fixture.writable.adapter.get,
            list: fixture.writable.adapter.list,
          },
        },
      ])
    ).toThrow("Create screen requires a create adapter");
  });
});
