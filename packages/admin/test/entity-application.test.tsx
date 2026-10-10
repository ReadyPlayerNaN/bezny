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
import type { AdminCommand, AdminEntity } from "../src/admin-entity-model.js";
import {
  AdminApplicationProvider,
  createAdminApplication,
} from "../src/admin-entity-routing.js";

const recordsAtom = atom([
  { id: "1", label: "Example" },
  { id: "a/b", label: "Encoded record" },
]);
const permissionAtom = atom(true);
const pageVersionAtom = atom(0);
const runAction = vi.fn<() => void>();
const runSave = vi.fn<() => void>();
const captureCommands = vi.fn<(commands: readonly AdminCommand[]) => void>();

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
const ListScreen = () => {
  const { entity } = useAdminEntityContext();
  return <h1>{entity?.label}</h1>;
};
const RecordScreen = () => {
  const { entity, recordId, view } = useAdminEntityContext();
  return (
    <h1>
      {entity?.key}:{recordId}:{view}
    </h1>
  );
};
const CreateScreen = () => {
  const { entity } = useAdminEntityContext();
  const commands = useMemo<AdminCommand[]>(
    () => [{ execute: runSave, id: "save", label: `Save ${entity?.key}` }],
    [entity]
  );
  useAdminPageCommands(commands);
  return <h1>Create {entity?.key}</h1>;
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

const writableEntity: AdminEntity = {
  actions: [
    {
      enabled: permissionAtom,
      execute: runAction,
      id: "archive",
      label: (scope) => `Archive ${scope.records[0]?.label}`,
      target: "record",
    },
  ],
  key: "books",
  label: "Books",
  records: recordsAtom,
  screens: {
    create: CreateScreen,
    detail: RecordScreen,
    list: ListScreen,
    update: RecordScreen,
  },
  singularLabel: "Book",
};
const readonlyEntity: AdminEntity = {
  key: "people",
  label: "People",
  records: recordsAtom,
  screens: { detail: RecordScreen, list: ListScreen },
  singularLabel: "Person",
};

const renderApplication = async (
  path = "/books",
  entities: readonly AdminEntity[] = [writableEntity, readonlyEntity]
) => {
  const application = createAdminApplication({
    NotFound,
    Root,
    entities,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<AdminApplicationProvider application={application} />);
  await screen.findByRole("heading");
  return {
    application,
    commands: within(screen.getByRole("region", { name: "Commands" })),
    user: userEvent.setup(),
  };
};

describe("entity application", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    runAction.mockClear();
    runSave.mockClear();
  });
  afterEach(() => {
    cleanup();
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

  it("supports a renamed entity without adding routes or palette entries", async () => {
    const renamed = {
      ...writableEntity,
      key: "documents",
      label: "Documents",
      singularLabel: "Document",
    };
    const { user, commands, application } = await renderApplication(
      "/documents",
      [renamed]
    );
    await user.click(commands.getByRole("button", { name: "View Example" }));
    await screen.findByRole("heading", { name: "documents:1:detail" });
    expect(application.router.state.location.pathname).toBe("/documents/1");
    await user.click(commands.getByRole("button", { name: "Edit Example" }));
    await screen.findByRole("heading", { name: "documents:1:update" });
    expect(application.router.state.location.pathname).toBe(
      "/documents/1/edit"
    );
    expect(
      commands.getByRole("button", { name: "Create document" })
    ).toBeDefined();
  });

  it("uses the matched entity and decoded record ID for direct URLs and generated navigation", async () => {
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

  it("does not mutate another entity's selection through stale row or clear commands", async () => {
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

  it("registers real screen callbacks and removes them when the matched screen leaves", async () => {
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

  it("invalidates page callbacks when their registration is replaced on the same screen", async () => {
    const entity = {
      ...writableEntity,
      screens: { ...writableEntity.screens, create: VersionedScreen },
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

  it("removes stale record actions and rechecks availability at execution", async () => {
    const { commands, application, user } = await renderApplication();
    await user.click(commands.getByRole("button", { name: "Archive Example" }));
    expect(runAction).toHaveBeenCalledOnce();
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
    act(() => {
      application.store.set(recordsAtom, []);
    });
    expect(commands.queryByRole("button", { name: "View Example" })).toBeNull();
  });

  it("renders unavailable entities, records, and unsupported operations without fabricated actions", async () => {
    const { commands } = await renderApplication("/people/create");
    expect(screen.getByRole("heading", { name: "Unavailable" })).toBeDefined();
    expect(
      commands.queryByRole("button", { name: "Create person" })
    ).toBeNull();
    expect(commands.queryByRole("button", { name: "View Example" })).toBeNull();
  });

  it.each([
    "/ghost/1",
    "/books/unknown",
    "/people/1/edit",
    "/outside/the/entity/route/tree",
  ])(
    "handles unavailable route %s without exposing stale record actions",
    async (path) => {
      const { commands } = await renderApplication(path);
      expect(
        screen.getByRole("heading", { name: "Unavailable" })
      ).toBeDefined();
      expect(
        commands.queryByRole("button", { name: "Archive Example" })
      ).toBeNull();
      expect(
        commands.queryByRole("button", { name: "Edit Example" })
      ).toBeNull();
    }
  );

  it("rejects reserved and duplicate record references", () => {
    const reserved = {
      ...writableEntity,
      records: atom([{ id: "create", label: "Reserved" }]),
    };
    expect(() =>
      createAdminApplication({
        NotFound,
        Root,
        entities: [reserved],
        history: createMemoryHistory(),
      })
    ).toThrow("Invalid or reserved record ID");
    const duplicate = {
      ...writableEntity,
      records: atom([
        { id: "1", label: "First" },
        { id: "1", label: "Second" },
      ]),
    };
    expect(() =>
      createAdminApplication({
        NotFound,
        Root,
        entities: [duplicate],
        history: createMemoryHistory(),
      })
    ).toThrow("Duplicate record ID");
  });

  it("rejects duplicate entities, invalid slugs, and duplicate action identities", () => {
    expect(() =>
      createAdminEntityRegistry([writableEntity, writableEntity])
    ).toThrow("Duplicate admin entity key");
    expect(() =>
      createAdminEntityRegistry([{ ...writableEntity, key: "not/a/slug" }])
    ).toThrow("Invalid admin entity key");
    const [action] = writableEntity.actions ?? [];
    if (!action) {
      throw new Error("Expected fixture action.");
    }
    expect(() =>
      createAdminEntityRegistry([
        { ...writableEntity, actions: [action, action] },
      ])
    ).toThrow("Duplicate action");
  });
});
