import {
  createMemoryHistory,
  defaultParseSearch,
  defaultStringifySearch,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import type { AnyRouter } from "@tanstack/react-router";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAdminRuntime } from "../src/admin-application-runtime.js";
import type { AdminRuntime } from "../src/admin-application-runtime.js";
import { defineAdminEntity } from "../src/admin-data-adapter.js";
import type {
  AdminDataAdapter,
  AdminListQuery,
  AdminListResult,
} from "../src/admin-data-adapter.js";
import { adminSelectionAtom } from "../src/admin-entity-model.js";
import {
  AdminApplicationProvider,
  AdminEntityScreen,
  createAdminApplication,
} from "../src/admin-entity-routing.js";
import { adminListQueriesAtom } from "../src/admin-list-state.js";
import {
  attachFileRoutes,
  fileRouteBindings,
} from "./file-route-application.js";

const Root = () => (
  <main>
    <Outlet />
  </main>
);
const records = [
  { id: "1", label: "Alpha", status: "draft" },
  { id: "2", label: "Beta", status: "live" },
  { id: "3", label: "Gamma", status: "draft" },
];
type RecordItem = (typeof records)[number];
type Adapter = AdminDataAdapter<RecordItem, unknown>;
type Application = AdminRuntime & { router: AnyRouter };
const applications: Application[] = [];
const listRecords = (query: AdminListQuery): AdminListResult<RecordItem> => {
  const filtered = records.filter(
    (record) =>
      (!query.filters.search ||
        record.label
          .toLowerCase()
          .includes(query.filters.search.toLowerCase())) &&
      (!query.filters.status || record.status === query.filters.status)
  );
  return {
    items: filtered.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize
    ),
    total: filtered.length,
  };
};
const mount = async (application: Application) => {
  await act(async () => {
    await application.router.load();
  });
  render(<AdminApplicationProvider application={application} />);
};

describe.each(["programmatic", "file-based"])(
  "collection URLs (%s)",
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
        releasePointerCapture: {
          configurable: true,
          value: () => {
            /* No pointer capture in jsdom. */
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
    });
    afterEach(() => {
      cleanup();
      for (const application of applications.splice(0)) {
        application.dispose();
      }
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });
    const setup = (
      search: Record<string, unknown> = {},
      list = vi.fn<Adapter["list"]>((query) =>
        Promise.resolve(listRecords(query))
      ),
      pageSize = 2
    ) => {
      const definition = (key: string) =>
        defineAdminEntity({
          adapter: {
            get: (id) =>
              Promise.resolve(
                records.find((record) => record.id === id) ?? null
              ),
            list,
          },
          filters: [
            { key: "search", label: "Search" },
            {
              key: "status",
              label: "Status",
              options: [
                { label: "Draft", value: "draft" },
                { label: "Live", value: "live" },
              ],
            },
          ],
          key,
          label: key,
          pageSize,
          parseValues: (value: unknown) => value,
          reference: (record) => record,
          singularLabel: "Record",
        });
      const options = {
        Root,
        entities: [definition("records"), definition("people")],
        history: createMemoryHistory({
          initialEntries: [`/records${defaultStringifySearch(search)}`],
        }),
      };
      const application: Application =
        mode === "programmatic"
          ? createAdminApplication(options)
          : attachFileRoutes(
              createAdminRuntime({ ...options, routes: fileRouteBindings }),
              options,
              AdminEntityScreen
            );
      application.router.routeTree.update({
        beforeLoad: () => {
          // Each fixture owns its host guard, including reused file-route definitions.
        },
      });
      applications.push(application);
      return { application, list };
    };

    it("preserves host loader dependency fields while adding the collection query", async () => {
      const { application } = setup({ page: 2, tenant: "acme" });
      application.router.routesById[application.routes.list.id]?.update({
        loaderDeps: ({ search }: { search: Record<string, unknown> }) => ({
          tenant: search.tenant,
        }),
      });
      application.attach(application.router);
      await application.router.load();
      expect(application.router.state.matches.at(-1)?.loaderDeps).toMatchObject(
        { beznyCollectionQuery: { page: 2 }, tenant: "acme" }
      );
      expect(
        application.store
          .get(application.session.snapshotAtom)
          .items.map((item) => item.id)
      ).toStrictEqual(["3"]);
    });

    it("hydrates a fresh application from a shared URL before fetching", async () => {
      const { application, list } = setup({
        filters: { search: "a", status: "draft" },
        page: 2,
        pageSize: 1,
      });
      await application.router.load();
      expect(list).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { search: "a", status: "draft" },
          page: 2,
          pageSize: 1,
        }),
        expect.anything()
      );
      expect(application.store.get(adminListQueriesAtom).records).toMatchObject(
        { filters: { search: "a", status: "draft" }, page: 2, pageSize: 1 }
      );
      expect(
        application.store
          .get(application.session.snapshotAtom)
          .items.map((item) => item.id)
      ).toStrictEqual(["3"]);
    });

    it("writes search, filters, and page size to the URL and renders real page hyperlinks", async () => {
      const { application } = setup(
        { pageSize: 2, tenant: "acme" },
        undefined,
        1
      );
      await mount(application);
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Search: All" }));
      await user.type(screen.getByRole("textbox", { name: "Search" }), "a");
      await user.click(screen.getByRole("button", { name: "Apply" }));
      await user.click(screen.getByRole("button", { name: "Status: All" }));
      await user.click(await screen.findByRole("radio", { name: "Draft" }));
      await user.click(
        screen.getByRole("combobox", { name: "Records per page" })
      );
      await user.click(await screen.findByRole("option", { name: "1" }));
      const page = await screen.findByRole("link", { name: "Page 2" });
      const href = page.getAttribute("href");
      if (!href) {
        throw new Error("Pagination must provide a shareable href.");
      }
      expect(new URL(href, "http://localhost").searchParams.get("page")).toBe(
        "2"
      );
      page.focus();
      await user.keyboard("{Enter}");
      await screen.findByText("Gamma");
      expect({ ...application.router.state.location.search }).toStrictEqual({
        filters: { search: "a", status: "draft" },
        page: 2,
        tenant: "acme",
      });
      const copied = setup(
        defaultParseSearch(new URL(href, "http://localhost").search),
        undefined,
        1
      );
      await copied.application.router.load();
      expect(
        copied.application.store
          .get(copied.application.session.snapshotAtom)
          .items.map((item) => item.id)
      ).toStrictEqual(["3"]);
    });

    it("restores page, search, and filters through Back/Forward and isolates bare entity URLs", async () => {
      const { application } = setup({
        filters: { search: "a", status: "draft" },
        pageSize: 1,
      });
      await mount(application);
      const user = userEvent.setup();
      await user.click(screen.getByRole("link", { name: "Page 2" }));
      await screen.findByText("Gamma");
      await user.click(screen.getByRole("checkbox", { name: "Select Gamma" }));
      await act(() => {
        application.router.history.back();
      });
      await screen.findByText("Alpha");
      expect(
        application.store.get(application.session.snapshotAtom).query
      ).toMatchObject({
        filters: { search: "a", status: "draft" },
        page: 1,
        pageSize: 1,
      });
      expect(application.store.get(adminSelectionAtom)).toBeNull();
      await act(() => {
        application.router.history.forward();
      });
      await screen.findByText("Gamma");
      expect(application.router.state.location.search.page).toBe(2);
      await act(async () => {
        await application.router.navigate({
          params: { entity: "people" },
          search: {},
          to: application.routes.list.path,
        });
      });
      expect(
        application.store.get(application.session.snapshotAtom).query
      ).toMatchObject({ filters: {}, page: 1, pageSize: 2 });
    });

    it("restores changed search, filters and page size through browser history", async () => {
      const { application } = setup({
        filters: { search: "a", status: "draft" },
        page: 2,
        pageSize: 1,
      });
      await mount(application);
      await act(async () => {
        await application.router.navigate({
          params: { entity: "records" },
          search: { filters: { search: "Beta" }, pageSize: 10 },
          to: application.routes.list.path,
        });
      });
      await screen.findByText("Beta");
      expect(
        application.store.get(application.session.snapshotAtom).query
      ).toMatchObject({ filters: { search: "Beta" }, page: 1, pageSize: 10 });
      await act(() => {
        application.router.history.back();
      });
      await screen.findByText("Gamma");
      expect(
        application.store.get(application.session.snapshotAtom).query
      ).toMatchObject({
        filters: { search: "a", status: "draft" },
        page: 2,
        pageSize: 1,
      });
      await act(() => {
        application.router.history.forward();
      });
      await screen.findByText("Beta");
      expect(screen.getByRole("button", { name: "Search: Beta" })).toBeTruthy();
      expect(
        screen.getByRole("combobox", { name: "Records per page" }).textContent
      ).toBe("10");
    });

    it("returns from detail to the collection's remembered URL query", async () => {
      const { application } = setup({
        filters: { status: "draft" },
        page: 2,
        pageSize: 1,
      });
      await mount(application);
      const user = userEvent.setup();
      await user.click(screen.getByRole("link", { name: "Gamma" }));
      await screen.findByRole("heading", { name: "Gamma" });
      await user.click(screen.getByRole("button", { name: "List records" }));
      await screen.findByRole("link", { name: "Gamma" });
      expect({ ...application.router.state.location.search }).toStrictEqual({
        filters: { status: "draft" },
        page: 2,
        pageSize: 1,
      });
      expect(
        application.store.get(application.session.snapshotAtom).query
      ).toMatchObject({ filters: { status: "draft" }, page: 2, pageSize: 1 });
    });

    it("resets pagination on clear filters and replaces out-of-range page URLs", async () => {
      const { application } = setup({
        filters: { search: "a", status: "draft" },
        page: 99,
        pageSize: 1,
      });
      await mount(application);
      await screen.findByText("Gamma");
      await waitFor(() =>
        expect(application.router.state.location.search.page).toBe(2)
      );
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Clear filters" }));
      await screen.findByText("Alpha");
      expect({ ...application.router.state.location.search }).toStrictEqual({
        pageSize: 1,
      });
      expect(application.router.history).toHaveLength(2);
    });

    it("does not let query preloads alter visible state or suppress subsequent navigation", async () => {
      const { application, list } = setup();
      await mount(application);
      const snapshot = application.store.get(application.session.snapshotAtom);
      const queries = application.store.get(adminListQueriesAtom);
      await act(async () => {
        await application.router.preloadRoute({
          params: { entity: "records" },
          search: { page: 2 },
          to: application.routes.list.path,
        });
      });
      expect(application.store.get(application.session.snapshotAtom)).toBe(
        snapshot
      );
      expect(application.store.get(adminListQueriesAtom)).toBe(queries);
      await act(async () => {
        await application.router.navigate({
          params: { entity: "records" },
          search: { page: 2 },
          to: application.routes.list.path,
        });
      });
      await screen.findByText("Gamma");
      expect(list).toHaveBeenCalledTimes(2);
    });

    it("keeps the previous query and selection until a host guard admits query navigation", async () => {
      const { application, list } = setup();
      await mount(application);
      application.store.set(adminSelectionAtom, {
        entity: "records",
        ids: ["1"],
      });
      const snapshot = application.store.get(application.session.snapshotAtom);
      const gate = Promise.withResolvers<boolean>();
      const guard = vi.fn<
        (args: {
          location: { search: Record<string, unknown> };
        }) => Promise<void>
      >(
        async ({
          location,
        }: {
          location: { search: Record<string, unknown> };
        }) => {
          if (location.search.page === 2) {
            await gate.promise;
          }
        }
      );
      application.router.routeTree.update({ beforeLoad: guard });
      const navigating = application.router.navigate({
        params: { entity: "records" },
        search: { page: 2 },
        to: application.routes.list.path,
      });
      await waitFor(() => expect(guard).toHaveBeenCalledOnce());
      expect(application.store.get(application.session.snapshotAtom)).toBe(
        snapshot
      );
      await act(async () => {
        gate.reject(
          redirect({
            params: { entity: "records" },
            search: {},
            to: application.routes.list.path,
          })
        );
        await navigating;
      });
      expect(application.store.get(adminSelectionAtom)?.ids).toStrictEqual([
        "1",
      ]);
      expect(list).toHaveBeenCalledOnce();
      expect(application.store.get(adminListQueriesAtom).records?.page).toBe(1);
    });

    it("ignores late results from a superseded query on the same listing route", async () => {
      const held = Promise.withResolvers<AdminListResult<RecordItem>>();
      const list = vi.fn<Adapter["list"]>((query) =>
        query.page === 2 ? held.promise : Promise.resolve(listRecords(query))
      );
      const { application } = setup({}, list);
      await mount(application);
      let first: Promise<void>;
      act(() => {
        first = application.router.navigate({
          params: { entity: "records" },
          search: { page: 2 },
          to: application.routes.list.path,
        });
      });
      await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
      await act(async () => {
        await application.router.navigate({
          params: { entity: "records" },
          search: { filters: { search: "Beta" } },
          to: application.routes.list.path,
        });
      });
      await act(async () => {
        held.resolve({
          items: records.filter((record) => record.id === "3"),
          total: 3,
        });
        await first;
      });
      expect({ ...application.router.state.location.search }).toStrictEqual({
        filters: { search: "Beta" },
      });
      expect(
        application.store
          .get(application.session.snapshotAtom)
          .items.map((item) => item.id)
      ).toStrictEqual(["2"]);
      expect(
        application.store.get(adminListQueriesAtom).records?.filters
      ).toStrictEqual({ search: "Beta" });
    });
  }
);
