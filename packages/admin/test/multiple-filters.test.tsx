import {
  createMemoryHistory,
  defaultStringifySearch,
  Outlet,
} from "@tanstack/react-router";
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  defineAdminEntity,
  decodeAdminFilterSelection,
} from "../src/admin-data-adapter.js";
import type {
  AdminListQuery,
  AdminDataAdapter,
} from "../src/admin-data-adapter.js";
import { adminSelectionAtom } from "../src/admin-entity-model.js";
import type { AdminCommand } from "../src/admin-entity-model.js";
import {
  createAdminApplication,
  AdminApplicationProvider,
} from "../src/admin-entity-routing.js";
import { AdminHeader } from "../src/admin-header.js";
import { AdminLayout } from "../src/admin-layout.js";
import { useAdminListControls } from "../src/admin-list-controls.js";

let currentFilter: AdminCommand | undefined;
const CommandObserver = () => {
  const { filterCommands } = useAdminListControls();
  useEffect(() => {
    [currentFilter] = filterCommands;
    return () => {
      currentFilter = undefined;
    };
  }, [filterCommands]);
  return null;
};
const Root = () => (
  <AdminLayout header={<AdminHeader title="Editorial" />}>
    <CommandObserver />
    <Outlet />
  </AdminLayout>
);
const records = [
  { category: "news", id: "1", label: "Alpha" },
  { category: "guides", id: "2", label: "Beta" },
  { category: "notes", id: "3", label: "Gamma" },
];
const applications: ReturnType<typeof createAdminApplication>[] = [];

const setup = async (search: Record<string, unknown> = {}) => {
  const list = vi.fn<
    AdminDataAdapter<(typeof records)[number], unknown>["list"]
  >((query: AdminListQuery) => {
    const categories = decodeAdminFilterSelection(query.filters.category ?? "");
    const filtered = records.filter(
      (record) => !categories.length || categories.includes(record.category)
    );
    return Promise.resolve({
      items: filtered.slice(
        (query.page - 1) * query.pageSize,
        query.page * query.pageSize
      ),
      total: filtered.length,
    });
  });
  const entity = defineAdminEntity({
    adapter: {
      get: (id) =>
        Promise.resolve(records.find((record) => record.id === id) ?? null),
      list,
    },
    filters: [
      {
        key: "category",
        label: "Category",
        multiple: true,
        options: [
          { label: "News", value: "news" },
          { label: "Guides", value: "guides" },
          { label: "Notes", value: "notes" },
        ],
      },
    ],
    key: "articles",
    label: "Articles",
    pageSize: 2,
    parseValues: (value: unknown) => value,
    reference: (record) => record,
    singularLabel: "Article",
  });
  const application = createAdminApplication({
    Root,
    entities: [entity],
    history: createMemoryHistory({
      initialEntries: [`/articles${defaultStringifySearch(search)}`],
    }),
  });
  applications.push(application);
  await act(async () => {
    await application.router.load();
  });
  render(<AdminApplicationProvider application={application} />);
  await screen.findByRole("heading", { name: "Articles" });
  return { application, list, user: userEvent.setup() };
};

describe("registered multi-choice controls", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockReturnValue();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn<() => void>();
        unobserve = vi.fn<() => void>();
        disconnect = vi.fn<() => void>();
      }
    );
    Object.defineProperties(Element.prototype, {
      hasPointerCapture: { configurable: true, value: () => false },
      releasePointerCapture: { configurable: true, value: () => {} },
      scrollIntoView: { configurable: true, value: () => {} },
      setPointerCapture: { configurable: true, value: () => {} },
    });
  });
  afterEach(() => {
    cleanup();
    for (const application of applications.splice(0)) {
      application.dispose();
    }
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects invalid commands and ignores retained commands after leaving the collection", async () => {
    const { application, list } = await setup();
    const command = currentFilter?.input;
    if (!command) {
      throw new Error("Missing registered filter command");
    }
    expect(() => command.execute('["missing"]')).toThrow(
      "Invalid filter value"
    );
    await act(async () => {
      await application.router.navigate({
        params: { entity: "articles", recordId: "1" },
        to: "/$entity/$recordId",
      });
    });
    await screen.findByRole("heading", { name: "Alpha" });
    const calls = list.mock.calls.length;
    await act(async () => {
      await command.execute('["news"]');
    });
    expect(application.router.state.location.pathname).toBe("/articles/1");
    expect(list).toHaveBeenCalledTimes(calls);
  });

  it("loads a copied selection URL through the real default list and adapter", async () => {
    const { list } = await setup({
      filters: { category: '["news","guides"]' },
      page: 2,
      pageSize: 1,
    });
    await expect(
      screen.findByRole("link", { name: "Beta" })
    ).resolves.not.toBeNull();
    expect(screen.queryByRole("link", { name: "Gamma" })).toBeNull();
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: { category: '["news","guides"]' },
        page: 2,
        pageSize: 1,
      }),
      expect.anything()
    );
  });

  it("updates checkbox filters, resets page/selection, and restores history", async () => {
    const { application, user } = await setup({ page: 2, tenant: "editorial" });
    await user.click(screen.getByRole("checkbox", { name: "Select Gamma" }));
    await user.click(screen.getByRole("button", { name: "Category: All" }));
    await user.click(await screen.findByRole("checkbox", { name: "News" }));
    await screen.findByRole("link", { name: "Alpha" });
    expect({ ...application.router.state.location.search }).toStrictEqual({
      filters: { category: '["news"]' },
      tenant: "editorial",
    });
    expect(application.store.get(adminSelectionAtom)).toBeNull();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Category: News" }));
    await user.click(await screen.findByRole("checkbox", { name: "Guides" }));
    await screen.findByRole("link", { name: "Beta" });
    expect(application.router.state.location.search).toHaveProperty(
      "filters.category",
      '["news","guides"]'
    );
    await user.keyboard("{Escape}");
    act(() => {
      application.router.history.back();
    });
    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "Beta" })).toBeNull()
    );
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await screen.findByRole("link", { name: "Beta" });
    expect({ ...application.router.state.location.search }).toStrictEqual({
      tenant: "editorial",
    });
  });

  it("uses the same selection command from the RHF palette without changing the URL until Apply", async () => {
    const { application, user } = await setup();
    await user.click(screen.getByRole("button", { name: "Command palette" }));
    await user.click(
      await screen.findByRole("option", { name: "Filter by Category" })
    );
    const dialog = screen.getByRole("dialog", { name: "Command palette" });
    await user.click(within(dialog).getByRole("checkbox", { name: "News" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "Guides" }));
    expect({ ...application.router.state.location.search }).toStrictEqual({});
    await user.click(
      within(dialog).getByRole("button", { name: "Apply command" })
    );
    await screen.findByRole("button", { name: "Category: News, Guides" });
    expect({ ...application.router.state.location.search }).toStrictEqual({
      filters: { category: '["news","guides"]' },
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
