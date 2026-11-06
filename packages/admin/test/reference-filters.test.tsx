import {
  createMemoryHistory,
  defaultStringifySearch,
  Outlet,
} from "@tanstack/react-router";
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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  defineAdminEntity,
  decodeAdminFilterSelection,
} from "../src/admin-data-adapter.js";
import type {
  AdminFilterReference,
  AdminReferenceFilterSource,
  AdminDataAdapter,
} from "../src/admin-data-adapter.js";
import { adminSelectionAtom } from "../src/admin-entity-model.js";
import {
  createAdminApplication,
  AdminApplicationProvider,
} from "../src/admin-entity-routing.js";
import { AdminHeader } from "../src/admin-header.js";
import { AdminLayout } from "../src/admin-layout.js";

const Root = () => (
  <AdminLayout header={<AdminHeader title="Editorial" />}>
    <Outlet />
  </AdminLayout>
);
const categories = [
  { label: "News", value: "news" },
  { label: "Guides", value: "guides" },
  { label: "Complete collection", value: "all" },
];
const records = [
  { category: "news", id: "1", label: "Alpha" },
  { category: "guides", id: "2", label: "Beta" },
  { category: "all", id: "3", label: "Gamma" },
];
const applications: ReturnType<typeof createAdminApplication>[] = [];
const deferred = () => Promise.withResolvers<readonly AdminFilterReference[]>();
const setup = async ({
  multiple = true,
  initial = {},
}: { multiple?: boolean; initial?: Record<string, unknown> } = {}) => {
  const search = vi.fn<AdminReferenceFilterSource["search"]>((query) =>
    Promise.resolve(
      categories.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    )
  );
  const resolve = vi.fn<AdminReferenceFilterSource["resolve"]>((ids) =>
    Promise.resolve(categories.filter((item) => ids.includes(item.value)))
  );
  const list = vi.fn<
    AdminDataAdapter<(typeof records)[number], unknown>["list"]
  >((query) => {
    const value = query.filters.category ?? "";
    let selected = value ? [value] : [];
    if (multiple) {
      selected = decodeAdminFilterSelection(value);
    }
    const filtered = records.filter(
      (record) => !selected.length || selected.includes(record.category)
    );
    return Promise.resolve({
      items: filtered.slice(
        (query.page - 1) * query.pageSize,
        query.page * query.pageSize
      ),
      total: filtered.length,
    });
  });
  const definition = defineAdminEntity({
    adapter: {
      get: (id) =>
        Promise.resolve(records.find((record) => record.id === id) ?? null),
      list,
    },
    filters: [
      {
        key: "category",
        label: "Category",
        multiple,
        reference: { resolve, search },
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
    entities: [definition, { ...definition, key: "stories", label: "Stories" }],
    history: createMemoryHistory({
      initialEntries: [`/articles${defaultStringifySearch(initial)}`],
    }),
  });
  applications.push(application);
  await act(async () => {
    await application.router.load();
  });
  const rendered = render(
    <AdminApplicationProvider application={application} />
  );
  await screen.findByRole("heading", { name: "Articles" });
  return {
    application,
    list,
    resolve,
    search,
    unmount: rendered.unmount,
    user: userEvent.setup(),
  };
};

describe("registered asynchronous reference filters", () => {
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

  it("resolves copied IDs without dropping missing references and supports removal", async () => {
    const { application, resolve, user } = await setup({
      initial: { filters: { category: '["news","missing"]' } },
    });
    await screen.findByRole("button", { name: "Remove News" });
    expect(resolve).toHaveBeenLastCalledWith(
      ["news", "missing"],
      expect.objectContaining({ limit: 2, locale: "en" })
    );
    await user.click(screen.getByRole("button", { name: "Remove missing" }));
    await waitFor(() =>
      expect(application.router.state.location.search).toHaveProperty(
        "filters.category",
        '["news"]'
      )
    );
    await user.click(screen.getByRole("button", { name: "Remove News" }));
    await waitFor(() =>
      expect(application.router.state.location.search).not.toHaveProperty(
        "filters"
      )
    );
  });

  it("debounces search, selects by keyboard and resets page/selection through the standard command", async () => {
    const { application, search, list, user } = await setup({
      initial: { page: 2, tenant: "editorial" },
    });
    await user.click(screen.getByRole("checkbox", { name: "Select Gamma" }));
    await user.type(screen.getByRole("combobox", { name: "Category" }), "News");
    expect(search).not.toHaveBeenCalled();
    await screen.findByRole("option", { name: "News" });
    await user.keyboard("{Enter}");
    await screen.findByRole("link", { name: "Alpha" });
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: { category: '["news"]' }, page: 1 }),
      expect.anything()
    );
    expect(application.store.get(adminSelectionAtom)).toBeNull();
    expect(application.router.state.location.search).toHaveProperty(
      "tenant",
      "editorial"
    );
    expect(search).toHaveBeenCalledOnce();
  });

  it("cancels superseded and dismissed searches even when transport ignores its signal", async () => {
    const { search, user } = await setup();
    const old = deferred();
    search.mockReturnValueOnce(old.promise);
    const input = screen.getByRole("combobox", { name: "Category" });
    await user.type(input, "old");
    await waitFor(() => expect(search).toHaveBeenCalledOnce());
    const oldSignal = search.mock.calls[0]?.[1].signal;
    await user.clear(input);
    await user.type(input, "Guides");
    await screen.findByRole("option", { name: "Guides" });
    await act(async () => {
      old.resolve([{ label: "Stale", value: "stale" }]);
      await old.promise;
    });
    expect(oldSignal?.aborted).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Stale" })).toBeNull();
    const pending = deferred();
    search.mockReturnValueOnce(pending.promise);
    await user.clear(input);
    await user.type(input, "waiting");
    await waitFor(() => expect(search).toHaveBeenCalledTimes(3));
    const signal = search.mock.calls[2]?.[1].signal;
    await user.keyboard("{Escape}");
    await act(async () => {
      pending.resolve(categories);
      await pending.promise;
    });
    expect(signal?.aborted).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("retries lookup and resolution failures without changing authoritative filter IDs", async () => {
    const { resolve, search, application, user } = await setup();
    resolve.mockRejectedValueOnce(new Error("offline"));
    await act(async () => {
      await application.router.navigate({
        params: { entity: "articles" },
        search: { filters: { category: '["news"]' } },
        to: "/$entity",
      });
    });
    await user.click(
      await screen.findByRole("button", { name: "Retry selected labels" })
    );
    await screen.findByRole("button", { name: "Remove News" });
    search.mockRejectedValueOnce(new Error("offline"));
    await user.type(
      screen.getByRole("combobox", { name: "Category" }),
      "Guides"
    );
    await user.click(
      await screen.findByRole("button", { name: "Retry suggestions" })
    );
    expect(document.activeElement).toBe(
      screen.getByRole("combobox", { name: "Category" })
    );
    await screen.findByRole("option", { name: "Guides" });
    expect(application.router.state.location.search).toHaveProperty(
      "filters.category",
      '["news"]'
    );
    expect(search).toHaveBeenCalledTimes(2);
    expect(resolve).toHaveBeenCalledTimes(2);
  });

  it("keeps palette edits in RHF until Apply and supports scalar replacement", async () => {
    const { application, user } = await setup({
      initial: { filters: { category: "news" } },
      multiple: false,
    });
    await screen.findByRole("button", { name: "Remove News" });
    await user.click(screen.getByRole("button", { name: "Command palette" }));
    await user.click(
      await screen.findByRole("option", { name: "Filter by Category" })
    );
    const dialog = screen.getByRole("dialog", { name: "Command palette" });
    await user.type(
      within(dialog).getByRole("combobox", { name: "Category" }),
      "Guides"
    );
    await screen.findByRole("option", { name: "Guides" });
    await user.keyboard("{Enter}");
    await within(dialog).findByRole("button", { name: "Remove Guides" });
    expect(application.router.state.location.search).toHaveProperty(
      "filters.category",
      "news"
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Apply command" })
    );
    await screen.findByRole("link", { name: "Beta" });
    expect(application.router.state.location.search).toHaveProperty(
      "filters.category",
      "guides"
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("fences palette requests and stale edits when the entity changes", async () => {
    const { application, search, user } = await setup();
    const pending = deferred();
    search.mockReturnValueOnce(pending.promise);
    await user.click(screen.getByRole("button", { name: "Command palette" }));
    await user.click(
      await screen.findByRole("option", { name: "Filter by Category" })
    );
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByRole("combobox"), "old");
    await waitFor(() => expect(search).toHaveBeenCalledOnce());
    const signal = search.mock.calls[0]?.[1].signal;
    await act(async () => {
      await application.router.navigate({
        params: { entity: "stories" },
        to: "/$entity",
      });
    });
    await act(async () => {
      pending.resolve(categories);
      await pending.promise;
    });
    expect(signal?.aborted).toBeTruthy();
    expect(
      within(dialog).getByRole("combobox").hasAttribute("disabled")
    ).toBeTruthy();
    await user.click(
      within(dialog).getByRole("button", { name: "Apply command" })
    );
    expect(application.router.state.location.pathname).toBe("/stories");
    expect(application.router.state.location.search).not.toHaveProperty(
      "filters"
    );
  });

  it("aborts obsolete locale/query work and selected-label resolution on unmount", async () => {
    const { application, search, resolve, user, unmount } = await setup();
    const pending = deferred();
    search.mockReturnValueOnce(pending.promise);
    await user.type(screen.getByRole("combobox", { name: "Category" }), "old");
    await waitFor(() => expect(search).toHaveBeenCalledOnce());
    const signal = search.mock.calls[0]?.[1].signal;
    await act(async () => {
      await application.i18n.changeLanguage("cs");
    });
    await waitFor(() => expect(signal?.aborted).toBeTruthy());
    await act(async () => {
      pending.resolve(categories);
      await pending.promise;
    });
    expect(screen.queryByRole("option", { name: "News" })).toBeNull();
    const labels = deferred();
    resolve.mockReturnValueOnce(labels.promise);
    await act(async () => {
      await application.router.navigate({
        params: { entity: "articles" },
        search: { filters: { category: '["news"]' } },
        to: "/$entity",
      });
    });
    await waitFor(() => expect(resolve).toHaveBeenCalledOnce());
    const labelSignal = resolve.mock.calls[0]?.[1].signal;
    unmount();
    expect(labelSignal?.aborted).toBeTruthy();
    await act(async () => {
      labels.resolve(categories.slice(0, 1));
      await labels.promise;
    });
  });

  it("aborts work on disposal and avoids requests during IME composition", async () => {
    const { application, search, user } = await setup();
    const pending = deferred();
    search.mockReturnValue(pending.promise);
    const input = screen.getByRole("combobox", { name: "Category" });
    await user.click(input);
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "News" } });
    expect(search).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    await waitFor(() => expect(search).toHaveBeenCalledOnce());
    const signal = search.mock.calls[0]?.[1].signal;
    act(() => application.dispose());
    await waitFor(() => expect(signal?.aborted).toBeTruthy());
    await act(async () => {
      pending.resolve(categories);
      await pending.promise;
    });
    expect(screen.queryByRole("option", { name: "News" })).toBeNull();
  });
});
