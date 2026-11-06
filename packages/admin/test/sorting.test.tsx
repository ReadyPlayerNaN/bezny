import {
  createMemoryHistory,
  defaultStringifySearch,
  Outlet,
} from "@tanstack/react-router";
import type { AnyRouter } from "@tanstack/react-router";
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

import { createAdminRuntime } from "../src/admin-application-runtime.js";
import type { AdminRuntime } from "../src/admin-application-runtime.js";
import { defineAdminEntity } from "../src/admin-data-adapter.js";
import type { AdminDataAdapter } from "../src/admin-data-adapter.js";
import { adminSelectionAtom } from "../src/admin-entity-model.js";
import type { AdminCommand } from "../src/admin-entity-model.js";
import {
  createAdminApplication,
  AdminApplicationProvider,
  AdminEntityScreen,
} from "../src/admin-entity-routing.js";
import { AdminHeader } from "../src/admin-header.js";
import { AdminLayout } from "../src/admin-layout.js";
import { useAdminListControls } from "../src/admin-list-controls.js";
import {
  attachFileRoutes,
  fileRouteBindings,
} from "./file-route-application.js";

let currentSort: AdminCommand | null;
let currentFilter: AdminCommand | undefined;
const Observer = () => {
  const { sortCommand, filterCommands } = useAdminListControls();
  useEffect(() => {
    currentSort = sortCommand;
    [currentFilter] = filterCommands;
  });
  return null;
};
const Root = () => (
  <AdminLayout header={<AdminHeader title="Editorial" />}>
    <Observer />
    <Outlet />
  </AdminLayout>
);
const records = [
  { category: "news", id: "1", label: "Alpha" },
  { category: "news", id: "2", label: "Beta" },
  { category: "guides", id: "3", label: "Gamma" },
  { category: "guides", id: "4", label: "Delta" },
];
type Adapter = AdminDataAdapter<(typeof records)[number], unknown>;
type Application = AdminRuntime & { router: AnyRouter };
const applications: Application[] = [];
const listRecords: Adapter["list"] = (query) => {
  const filtered = records.filter(
    (record) =>
      !query.filters.category || record.category === query.filters.category
  );
  const sorted = filtered.toSorted((first, second) => {
    for (const rule of query.sort ?? []) {
      const key = rule.key === "category" ? "category" : "label";
      const compared = first[key].localeCompare(second[key]);
      if (compared) {
        return rule.direction === "asc" ? compared : -compared;
      }
    }
    return 0;
  });
  return Promise.resolve({
    items: sorted.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize
    ),
    total: sorted.length,
  });
};

describe.each(["programmatic", "file-based"])(
  "registered sorting (%s)",
  (mode) => {
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
      for (const app of applications.splice(0)) {
        app.dispose();
      }
      currentSort = null;
      currentFilter = undefined;
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });
    const setup = async (
      search: Record<string, unknown> = {},
      list = vi.fn<Adapter["list"]>(listRecords)
    ) => {
      const entity = defineAdminEntity({
        adapter: {
          get: (id) =>
            Promise.resolve(records.find((record) => record.id === id) ?? null),
          list,
          remove: () => Promise.resolve(),
        },
        filters: [
          {
            key: "category",
            label: "Category",
            options: [
              { label: "News", value: "news" },
              { label: "Guides", value: "guides" },
            ],
          },
        ],
        key: "articles",
        label: "Articles",
        pageSize: 2,
        parseValues: (value: unknown) => value,
        reference: (record) => record,
        singularLabel: "Article",
        sorting: {
          default: [{ direction: "asc", key: "label" }],
          fields: [
            { key: "label", label: "Title" },
            { key: "category", label: "Category" },
          ],
        },
      });
      const options = {
        Root,
        entities: [entity],
        history: createMemoryHistory({
          initialEntries: [`/articles${defaultStringifySearch(search)}`],
        }),
      };
      const application =
        mode === "programmatic"
          ? createAdminApplication(options)
          : attachFileRoutes(
              createAdminRuntime({ ...options, routes: fileRouteBindings }),
              options,
              AdminEntityScreen
            );
      applications.push(application);
      await act(async () => {
        await application.router.load();
      });
      render(<AdminApplicationProvider application={application} />);
      await screen.findByRole("heading", { name: "Articles" });
      return { application, list, user: userEvent.setup() };
    };

    it("hydrates copied sorting URLs in the adapter", async () => {
      const sort = [{ direction: "desc", key: "label" }];
      const { list } = await setup({ page: 2, sort });
      await screen.findByRole("link", { name: "Alpha" });
      expect(list.mock.calls.at(-1)?.[0]).toMatchObject({ page: 2, sort });
    });

    it("changes priority through the default editor, resetting page and selection with history restoration", async () => {
      const sort = [{ direction: "desc", key: "label" }];
      const { application, list, user } = await setup({
        page: 2,
        sort,
        tenant: "editorial",
      });
      await screen.findByRole("link", { name: "Alpha" });
      await user.click(screen.getByRole("checkbox", { name: "Select Alpha" }));
      await user.click(screen.getByRole("button", { name: "Sort records" }));
      const dialog = screen.getByRole("dialog", { name: "Sort records" });
      await user.click(
        within(dialog).getByRole("button", { name: "Add sorting field" })
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Move Category up" })
      );
      expect(application.router.state.location.search).toHaveProperty(
        "page",
        2
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Apply command" })
      );
      await screen.findByRole("link", { name: "Gamma" });
      const expected = [
        { direction: "asc", key: "category" },
        { direction: "desc", key: "label" },
      ];
      expect(list.mock.calls.at(-1)?.[0]).toMatchObject({
        page: 1,
        sort: expected,
      });
      expect({
        search: { ...application.router.state.location.search },
        selection: application.store.get(adminSelectionAtom),
      }).toStrictEqual({
        search: { sort: expected, tenant: "editorial" },
        selection: null,
      });
      act(() => application.router.history.back());
      await screen.findByRole("link", { name: "Alpha" });
      expect(application.router.state.location.search).toMatchObject({
        page: 2,
        sort,
      });
      act(() => application.router.history.forward());
      await screen.findByRole("link", { name: "Gamma" });
      expect(
        application.store.get(application.session.snapshotAtom).query.sort
      ).toStrictEqual(expected);
    });

    it("retains sorting through pagination, page-size changes and mutation refresh", async () => {
      const sort = [{ direction: "desc", key: "label" }];
      const { application, list, user } = await setup({ sort });
      await user.click(screen.getByRole("link", { name: "Page 2" }));
      await screen.findByRole("link", { name: "Alpha" });
      expect(list.mock.calls.at(-1)?.[0]).toMatchObject({ page: 2, sort });
      await user.click(
        screen.getByRole("combobox", { name: "Records per page" })
      );
      await user.click(await screen.findByRole("option", { name: "10" }));
      await waitFor(() =>
        expect(list.mock.calls.at(-1)?.[0]).toMatchObject({
          page: 1,
          pageSize: 10,
          sort,
        })
      );
      await act(async () => {
        await application.session.remove("articles", ["1"]);
      });
      expect(list.mock.calls.at(-1)?.[0]).toMatchObject({
        page: 1,
        pageSize: 10,
        sort,
      });
    });

    it("does not invoke retained sorting commands while paused or disposed", async () => {
      const { application, list } = await setup();
      const retained = currentSort?.input;
      const calls = list.mock.calls.length;
      await act(async () => {
        application.pause();
        await retained?.execute("[]");
      });
      expect({
        calls: list.mock.calls.length,
        search: { ...application.router.state.location.search },
      }).toStrictEqual({ calls, search: {} });
      await act(async () => {
        application.dispose();
        await retained?.execute("[]");
      });
      expect({
        calls: list.mock.calls.length,
        search: { ...application.router.state.location.search },
      }).toStrictEqual({ calls, search: {} });
    });

    it("shares RHF palette drafts, cancel, explicit clear, and restoring defaults", async () => {
      const { application, user } = await setup();
      await user.click(screen.getByRole("button", { name: "Sort records" }));
      await user.click(screen.getByRole("button", { name: "Clear sorting" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect({ ...application.router.state.location.search }).toStrictEqual({});
      await user.click(screen.getByRole("button", { name: "Command palette" }));
      await user.click(
        await screen.findByRole("option", { name: "Sort records" })
      );
      const palette = screen.getByRole("dialog", { name: "Command palette" });
      await user.click(
        within(palette).getByRole("button", { name: "Clear sorting" })
      );
      expect({ ...application.router.state.location.search }).toStrictEqual({});
      await user.click(
        within(palette).getByRole("button", { name: "Apply command" })
      );
      await waitFor(() =>
        expect({ ...application.router.state.location.search }).toStrictEqual({
          sort: [],
        })
      );
      await user.click(screen.getByRole("button", { name: "Sort records" }));
      await user.click(
        screen.getByRole("button", { name: "Restore default sorting" })
      );
      await user.click(screen.getByRole("button", { name: "Apply command" }));
      await waitFor(() =>
        expect({ ...application.router.state.location.search }).toStrictEqual(
          {}
        )
      );
    });

    it("retains sort across filtering, pagination, refresh and locale while rejecting invalid and stale commands", async () => {
      const sort = [{ direction: "desc", key: "label" }];
      const { application, list } = await setup({ sort });
      const retainedSort = currentSort?.input;
      const retainedFilter = currentFilter?.input;
      expect(() =>
        retainedSort?.execute('[{"key":"missing","direction":"asc"}]')
      ).toThrow("Invalid sorting");
      await act(async () => {
        await retainedSort?.execute('[{"key":"category","direction":"asc"}]');
      });
      const calls = list.mock.calls.length;
      await act(async () => {
        await retainedSort?.execute("[]");
        await retainedFilter?.execute("news");
      });
      expect(list).toHaveBeenCalledTimes(calls);
      await act(async () => {
        await currentFilter?.input?.execute("news");
      });
      expect(list.mock.calls.at(-1)?.[0]).toMatchObject({
        filters: { category: "news" },
        sort: [{ direction: "asc", key: "category" }],
      });
      await act(async () => {
        await application.session.refresh();
        await application.i18n.changeLanguage("cs");
      });
      expect(list.mock.calls.at(-1)?.[0]).toMatchObject({
        locale: "cs",
        sort: [{ direction: "asc", key: "category" }],
      });
      const last = currentSort?.input;
      await act(async () => {
        await application.router.navigate({
          params: { entity: "articles", recordId: "1" },
          to: "/$entity/$recordId",
        });
        await last?.execute("[]");
      });
      expect(application.router.state.location.pathname).toBe("/articles/1");
    });

    it("fences late responses when sorting changes and separates cached sort results", async () => {
      const pending =
        Promise.withResolvers<Awaited<ReturnType<Adapter["list"]>>>();
      let delayed = false;
      let oldSignal: AbortSignal | undefined;
      const list = vi.fn<Adapter["list"]>((query, request) => {
        if (query.sort?.[0]?.direction === "desc" && !delayed) {
          delayed = true;
          oldSignal = request.signal;
          return pending.promise;
        }
        return listRecords(query, request);
      });
      const { application } = await setup({}, list);
      const oldCommand = currentSort?.input;
      let navigation: Promise<void> | void;
      act(() => {
        navigation = oldCommand?.execute(
          '[{"key":"label","direction":"desc"}]'
        );
      });
      await waitFor(() => expect(oldSignal).toBeDefined());
      await act(async () => {
        await application.router.navigate({
          params: { entity: "articles" },
          search: { sort: [{ direction: "asc", key: "category" }] },
          to: "/$entity",
        });
      });
      expect(oldSignal?.aborted).toBeTruthy();
      await act(async () => {
        pending.resolve({
          items: [{ category: "news", id: "late", label: "Late" }],
          total: 1,
        });
        await navigation;
      });
      expect(screen.queryByRole("link", { name: "Late" })).toBeNull();
      expect(
        application.store.get(application.session.snapshotAtom).query.sort
      ).toStrictEqual([{ direction: "asc", key: "category" }]);
      await act(async () => {
        await application.router.navigate({
          params: { entity: "articles" },
          search: {},
          to: "/$entity",
        });
      });
      await screen.findByRole("link", { name: "Alpha" });
      expect(list).toHaveBeenCalledTimes(3);
    });
  }
);
