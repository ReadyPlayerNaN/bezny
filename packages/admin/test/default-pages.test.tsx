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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineAdminEntity } from "../src/admin-data-adapter.js";
import type {
  AdminDataAdapter,
  AdminListResult,
} from "../src/admin-data-adapter.js";
import type { AdminEntityField } from "../src/admin-entity-fields.js";
import {
  adminSelectionAtom,
  adminPageCommandsAtom,
  createAdminEntityRegistry,
} from "../src/admin-entity-model.js";
import {
  createAdminApplication,
  AdminApplicationProvider,
} from "../src/admin-entity-routing.js";
import type { AdminApplication } from "../src/admin-entity-routing.js";

interface Article {
  id: string;
  title: string;
  body: string;
  published: boolean;
  priority: number;
  status: string;
}
type Values = Omit<Article, "id">;
const applications: AdminApplication[] = [];
const Root = () => (
  <main>
    <Outlet />
  </main>
);
const NotFound = () => <h1>Unavailable</h1>;
const parseValues = (values: unknown): Values => {
  if (
    !values ||
    typeof values !== "object" ||
    !("title" in values) ||
    typeof values.title !== "string" ||
    !("body" in values) ||
    typeof values.body !== "string" ||
    !("published" in values) ||
    typeof values.published !== "boolean" ||
    !("priority" in values) ||
    typeof values.priority !== "number" ||
    !("status" in values) ||
    typeof values.status !== "string"
  ) {
    throw new Error(`Invalid article: ${JSON.stringify(values)}`);
  }
  return {
    body: values.body,
    priority: values.priority,
    published: values.published,
    status: values.status,
    title: values.title,
  };
};
const fixture = (
  path = "/articles",
  overrides: Partial<AdminDataAdapter<Article, Values>> = {},
  deriveValues?: AdminEntityField["deriveValues"]
) => {
  let records: Article[] = [
    {
      body: "First body",
      id: "1",
      priority: 1,
      published: false,
      status: "draft",
      title: "First",
    },
    {
      body: "Second body",
      id: "2",
      priority: 2,
      published: true,
      status: "live",
      title: "Second",
    },
  ];
  const adapter: AdminDataAdapter<Article, Values> = {
    create: vi.fn<NonNullable<AdminDataAdapter<Article, Values>["create"]>>(
      (values) => {
        const record = { ...values, id: "3" };
        records.push(record);
        return Promise.resolve(record);
      }
    ),
    get: (id) =>
      Promise.resolve(records.find((record) => record.id === id) ?? null),
    list: vi.fn<AdminDataAdapter<Article, Values>["list"]>((query) => {
      const filtered = records.filter(
        (record) =>
          (!query.filters.search ||
            record.title.includes(query.filters.search)) &&
          (!query.filters.status || record.status === query.filters.status)
      );
      return Promise.resolve({
        items: filtered.slice(
          (query.page - 1) * query.pageSize,
          query.page * query.pageSize
        ),
        total: filtered.length,
      });
    }),
    remove: vi.fn<NonNullable<AdminDataAdapter<Article, Values>["remove"]>>(
      (ids) => {
        const targets = new Set(ids);
        records = records.filter((record) => !targets.has(record.id));
        return Promise.resolve();
      }
    ),
    update: vi.fn<NonNullable<AdminDataAdapter<Article, Values>["update"]>>(
      (id, values) => {
        const record = { ...values, id };
        records = records.map((item) => (item.id === id ? record : item));
        return Promise.resolve(record);
      }
    ),
    ...overrides,
  };
  const entity = defineAdminEntity({
    adapter,
    filters: [
      { key: "search", label: "Search" },
      {
        key: "status",
        label: "Publication",
        options: [
          { label: "Draft", value: "draft" },
          { label: "Live", value: "live" },
        ],
      },
    ],
    form: {
      defaultValues: { priority: 1, status: "draft" },
      fields: [
        { key: "title", label: "Title", required: true },
        { key: "body", label: "Body", type: "textarea" },
        { key: "published", label: "Published", type: "checkbox" },
        { key: "priority", label: "Priority", max: 5, min: 1, type: "number" },
        {
          ...(deriveValues ? { deriveValues } : {}),
          key: "status",
          label: "Status",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Live", value: "live" },
          ],
          type: "select",
        },
      ],
    },
    key: "articles",
    label: "Articles",
    pageSize: 1,
    parseValues,
    reference: (record) => ({ id: record.id, label: record.title }),
    singularLabel: "Article",
  });
  const app = createAdminApplication({
    NotFound,
    Root,
    entities: [entity],
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  applications.push(app);
  return { adapter, app, entity };
};
const mount = async (app: AdminApplication) => {
  await act(async () => {
    await app.router.load();
  });
  render(<AdminApplicationProvider application={app} />);
};

describe("registration-driven default pages", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn<() => void>();
        unobserve = vi.fn<() => void>();
        disconnect = vi.fn<() => void>();
      }
    );
    // jsdom lacks the layout/pointer APIs used by Radix controls.
    Object.defineProperties(Element.prototype, {
      hasPointerCapture: { configurable: true, value: () => false },
      releasePointerCapture: {
        configurable: true,
        value: () => {
          // No pointer capture in jsdom.
        },
      },
      scrollIntoView: {
        configurable: true,
        value: () => {
          /* No layout in jsdom. */
        },
      },
      setPointerCapture: {
        configurable: true,
        value: () => {
          /* No pointer capture in jsdom. */
        },
      },
    });
    vi.spyOn(window, "scrollTo").mockReturnValue();
  });
  afterEach(() => {
    cleanup();
    for (const app of applications.splice(0)) {
      app.dispose();
    }
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("derives listing, filters, pagination and empty states without screen components", async () => {
    const { app, adapter } = fixture();
    await mount(app);
    await expect(screen.findByText("First")).resolves.toBeTruthy();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await expect(screen.findByText("Second")).resolves.toBeTruthy();
    const search = screen.getByRole("textbox", { name: "Search" });
    await user.type(search, "Missing");
    const searchForm = search.closest("form");
    if (!searchForm) {
      throw new Error("Missing search form");
    }
    await user.click(within(searchForm).getByRole("button", { name: "Apply" }));
    await expect(screen.findByText("No records found.")).resolves.toBeTruthy();
    expect(adapter.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: { search: "Missing" }, page: 1 }),
      expect.anything()
    );
  });

  it("creates registered RHF fields, validates and focuses invalid fields", async () => {
    const { app, adapter } = fixture("/articles/create");
    await mount(app);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await expect(
      screen.findByText("This field is required.")
    ).resolves.toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: /Title/u })
    );
    expect(adapter.create).not.toHaveBeenCalled();
    await user.type(
      screen.getByRole("textbox", { name: /Title/u }),
      "New article"
    );
    await user.type(screen.getByRole("textbox", { name: "Body" }), "New body");
    await user.click(screen.getByRole("checkbox", { name: "Published" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await expect(
      screen.findByRole("heading", { name: "New article" })
    ).resolves.toBeTruthy();
    expect(adapter.create).toHaveBeenCalledWith(
      {
        body: "New body",
        priority: 1,
        published: true,
        status: "draft",
        title: "New article",
      },
      expect.anything()
    );
  });

  it("loads and updates registered fields and supports keyboard-operated choices", async () => {
    const { app, adapter } = fixture("/articles/1/edit");
    await mount(app);
    const user = userEvent.setup();
    await expect(screen.findByDisplayValue("First")).resolves.toBeTruthy();
    const title = screen.getByRole("textbox", { name: /Title/u });
    await user.clear(title);
    await user.type(title, "Updated article");
    screen.getByRole("combobox", { name: "Status" }).focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{End}{Enter}");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await expect(
      screen.findByRole("heading", { name: "Updated article" })
    ).resolves.toBeTruthy();
    expect(adapter.update).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({ status: "live", title: "Updated article" }),
      expect.anything()
    );
  });

  it("preserves selection and returns focus when deletion is cancelled", async () => {
    const { app, adapter } = fixture();
    await mount(app);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("checkbox", { name: "Select First" })
    );
    const trigger = screen.getByRole("button", { name: "Delete selected (1)" });
    await user.click(trigger);
    const dialog = await screen.findByRole("alertdialog");
    expect(document.activeElement).toBe(
      within(dialog).getByRole("button", { name: "Cancel" })
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(adapter.remove).not.toHaveBeenCalled();
    expect(app.store.get(adminSelectionAtom)?.ids).toStrictEqual(["1"]);
    expect(document.activeElement).toBe(trigger);
  });

  it("deletes selected records through confirmation and refreshes the page", async () => {
    const { app, adapter } = fixture();
    await mount(app);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("checkbox", { name: "Select First" })
    );
    await user.click(
      screen.getByRole("button", { name: "Delete selected (1)" })
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      })
    );
    await expect(screen.findByText("Second")).resolves.toBeTruthy();
    expect(adapter.remove).toHaveBeenCalledWith(["1"], expect.anything());
    expect(app.store.get(adminSelectionAtom)).toBeNull();
  });

  it("shows retry errors while retaining filter controls", async () => {
    const list = vi
      .fn<AdminDataAdapter<Article, Values>["list"]>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ items: [], total: 0 });
    const { app } = fixture("/articles", { list });
    await mount(app);
    await expect(screen.findByRole("alert")).resolves.toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Search" })).toBeTruthy();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Retry loading records" }));
    await expect(screen.findByText("No records found.")).resolves.toBeTruthy();
  });

  it("renders a default loading page while the initial route loader is pending", async () => {
    const gate = Promise.withResolvers<AdminListResult<Article>>();
    const { app } = fixture("/articles", { list: () => gate.promise });
    render(<AdminApplicationProvider application={app} />);
    await expect(
      screen.findByLabelText("Loading records…")
    ).resolves.toBeTruthy();
    await act(async () => {
      gate.resolve({ items: [], total: 0 });
      await gate.promise;
    });
    await expect(screen.findByText("No records found.")).resolves.toBeTruthy();
  });

  it("renders loading during refresh and keeps collection controls mounted", async () => {
    const gate = Promise.withResolvers<AdminListResult<Article>>();
    const list = vi
      .fn<AdminDataAdapter<Article, Values>["list"]>()
      .mockResolvedValueOnce({ items: [], total: 0 })
      .mockReturnValueOnce(gate.promise);
    const { app } = fixture("/articles", { list });
    await mount(app);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Refresh records" }));
    await expect(
      screen.findByLabelText("Loading records…")
    ).resolves.toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Search" })).toBeTruthy();
    await act(async () => {
      gate.resolve({ items: [], total: 0 });
      await gate.promise;
    });
    await expect(screen.findByText("No records found.")).resolves.toBeTruthy();
  });

  it("retains form values on mutation failure and exposes real palette Cancel", async () => {
    const create = vi
      .fn<NonNullable<AdminDataAdapter<Article, Values>["create"]>>()
      .mockRejectedValue(new Error("offline"));
    const { app } = fixture("/articles/create", { create });
    await mount(app);
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: /Title/u }), "Unsaved");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await expect(screen.findByRole("alert")).resolves.toBeTruthy();
    expect(screen.getByDisplayValue("Unsaved")).toBeTruthy();
    const cancel = app.store
      .get(adminPageCommandsAtom)
      ?.commands.find((command) => command.id === "articles.cancel");
    if (!cancel) {
      throw new Error("Missing registered Cancel command");
    }
    await act(async () => {
      await cancel.execute();
    });
    await expect(
      screen.findByRole("heading", { name: "Articles" })
    ).resolves.toBeTruthy();
    expect(app.store.get(adminPageCommandsAtom)).toBeNull();
  });

  it("retains the deletion dialog and selection after a backend failure", async () => {
    const remove = vi
      .fn<NonNullable<AdminDataAdapter<Article, Values>["remove"]>>()
      .mockRejectedValue(new Error("offline"));
    const { app } = fixture("/articles", { remove });
    await mount(app);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("checkbox", { name: "Select First" })
    );
    await user.click(
      screen.getByRole("button", { name: "Delete selected (1)" })
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await expect(within(dialog).findByRole("alert")).resolves.toBeTruthy();
    expect(app.store.get(adminSelectionAtom)?.ids).toStrictEqual(["1"]);
    expect(
      within(dialog)
        .getByRole("button", { name: "Delete" })
        .hasAttribute("disabled")
    ).toBeFalsy();
  });

  it("derives dependent form values and field palette commands from registration", async () => {
    const derive = vi.fn<NonNullable<AdminEntityField["deriveValues"]>>(
      (values) =>
        Promise.resolve({
          body: `Body ${values.status}`,
          title: `Title ${values.status}`,
        })
    );
    const { app } = fixture("/articles/1/edit", {}, derive);
    await mount(app);
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Live" }));
    await expect(screen.findByDisplayValue("Title live")).resolves.toBeTruthy();
    const command = app.store
      .get(adminPageCommandsAtom)
      ?.commands.find((item) => item.id === "articles.field.status");
    expect(command?.input?.value).toBe("live");
    await act(async () => {
      await command?.input?.execute("draft");
    });
    await expect(
      screen.findByDisplayValue("Title draft")
    ).resolves.toBeTruthy();
    expect(derive).toHaveBeenCalledTimes(2);
  });

  it("uses the package unavailable page without a custom NotFound component", async () => {
    const { app, entity } = fixture();
    app.dispose();
    const defaults = createAdminApplication({
      Root,
      entities: [entity],
      history: createMemoryHistory({ initialEntries: ["/articles/missing"] }),
    });
    applications.push(defaults);
    await mount(defaults);
    await expect(
      screen.findByRole("heading", { name: "Entity unavailable." })
    ).resolves.toBeTruthy();
    expect(screen.getByRole("button", { name: "List articles" })).toBeTruthy();
  });

  it("preserves registered deletion overrides without duplicate commands", () => {
    const { entity } = fixture();
    const execute = vi.fn<() => void>();
    const actions = [
      {
        execute,
        id: "delete",
        label: () => "Custom deletion",
        target: "record" as const,
      },
      {
        execute,
        id: "delete-selected",
        label: () => "Custom bulk deletion",
        target: "selection" as const,
      },
    ];
    const [resolved] = createAdminEntityRegistry([
      { ...entity, actions },
    ]).entities;
    expect(resolved?.actions).toStrictEqual(actions);
  });

  it("keeps custom screen overrides", async () => {
    const { app, entity } = fixture();
    app.dispose();
    const custom = {
      ...entity,
      screens: { list: () => <h1>Custom list</h1> },
    };
    const customApp = createAdminApplication({
      NotFound,
      Root,
      entities: [custom],
      history: createMemoryHistory({ initialEntries: ["/articles"] }),
    });
    applications.push(customApp);
    await mount(customApp);
    await expect(
      screen.findByRole("heading", { name: "Custom list" })
    ).resolves.toBeTruthy();
  });

  it("does not advertise unavailable mutations and rejects duplicate fields", () => {
    const { entity } = fixture();
    const [readonly] = createAdminEntityRegistry([
      {
        ...entity,
        adapter: { get: entity.adapter.get, list: entity.adapter.list },
      },
    ]).entities;
    expect(readonly?.screens.create).toBeUndefined();
    expect(readonly?.screens.update).toBeUndefined();
    expect(readonly?.actions).toStrictEqual([]);
    expect(() =>
      createAdminEntityRegistry([
        {
          ...entity,
          form: {
            fields: [
              { key: "title", label: "Title" },
              { key: "title", label: "Duplicate" },
            ],
          },
        },
      ])
    ).toThrow("Invalid or duplicate field");
  });
});
