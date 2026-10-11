import { createMemoryHistory, Outlet, redirect } from "@tanstack/react-router";
import type { AnyRouter } from "@tanstack/react-router";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminRuntime } from "../src/admin-application-runtime.js";
import { createAdminRuntime } from "../src/admin-application-runtime.js";
import { defineAdminEntity } from "../src/admin-data-adapter.js";
import type { AdminDataAdapter } from "../src/admin-data-adapter.js";
import { useAdminEntityContext } from "../src/admin-entity-context.js";
import { adminSelectionAtom } from "../src/admin-entity-model.js";
import {
  AdminApplicationProvider,
  AdminEntityScreen,
  createAdminApplication,
} from "../src/admin-entity-routing.js";
import {
  attachFileRoutes,
  fileRouteBindings,
} from "./file-route-application.js";

const Root = () => <Outlet />;
const NotFound = () => <h1>Unavailable</h1>;
const Record = () => <h1>{useAdminEntityContext().recordId}</h1>;
const List = () => <h1>Records</h1>;
const applications: (AdminRuntime & { router: AnyRouter })[] = [];

type Adapter = AdminDataAdapter<{ id: string; label: string }, unknown>;

describe.each(["programmatic", "file-based"])(
  "route lifecycle (%s)",
  (mode) => {
    beforeEach(() => {
      vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    });
    afterEach(() => {
      cleanup();
      for (const application of applications.splice(0)) {
        application.dispose();
      }
      vi.restoreAllMocks();
    });
    const setup = (
      get = vi.fn<Adapter["get"]>((id) => Promise.resolve({ id, label: id })),
      beforeLoad: () => void | Promise<void> = () => {}
    ) => {
      const list = vi.fn<Adapter["list"]>(() =>
        Promise.resolve({
          items: [{ id: "one", label: "One" }],
          total: 1,
        })
      );
      const entity = defineAdminEntity({
        adapter: { get, list },
        key: "records",
        label: "Records",
        parseValues: (value: unknown) => value,
        reference: (record) => record,
        screens: { detail: Record, list: List },
        singularLabel: "Record",
      });
      const options = {
        NotFound,
        Root,
        entities: [entity],
        history: createMemoryHistory({ initialEntries: ["/records"] }),
      };
      const application: AdminRuntime & { router: AnyRouter } =
        mode === "programmatic"
          ? createAdminApplication(options)
          : attachFileRoutes(
              createAdminRuntime({ ...options, routes: fileRouteBindings }),
              options,
              AdminEntityScreen
            );
      application.router.routeTree.update({ beforeLoad });
      applications.push(application);
      return { application, get, list };
    };

    it("does not fetch entity data before the host route guard admits navigation", async () => {
      const admitted = Promise.withResolvers<boolean>();
      const guard = vi.fn<() => Promise<void>>(async () => {
        await admitted.promise;
      });
      const { application, list } = setup(undefined, guard);
      const loading = application.router.load();
      await waitFor(() => expect(guard).toHaveBeenCalledOnce());
      expect(list).not.toHaveBeenCalled();
      admitted.resolve(true);
      await loading;
      expect(list).toHaveBeenCalledOnce();
      expect(
        application.store.get(application.session.snapshotAtom).status
      ).toBe("ready");
    });

    it.each(["/records", "/records/one"])(
      "preserves the current screen when a host guard denies navigation from %s",
      async (from) => {
        const { application, get } = setup();
        render(<AdminApplicationProvider application={application} />);
        await screen.findByRole("heading", { name: "Records" });
        await act(async () => {
          await application.router.navigate({ to: from });
        });
        const snapshot = application.store.get(
          application.session.snapshotAtom
        );
        const selection =
          from === "/records" ? { entity: "records", ids: ["one"] } : null;
        application.store.set(adminSelectionAtom, selection);
        const denied = Promise.withResolvers<boolean>();
        const guard = vi.fn<
          (args: { location: { pathname: string } }) => Promise<void>
        >(async ({ location }) => {
          if (location.pathname === "/records/two") {
            await denied.promise;
          }
        });
        application.router.routeTree.update({ beforeLoad: guard });
        const navigating = application.router.navigate({ to: "/records/two" });
        await waitFor(() => expect(guard).toHaveBeenCalledOnce());
        expect(application.store.get(application.session.snapshotAtom)).toBe(
          snapshot
        );
        expect(application.store.get(adminSelectionAtom)).toStrictEqual(
          selection
        );
        await act(async () => {
          denied.reject(redirect({ to: from }));
          await navigating;
        });
        await waitFor(() =>
          expect(application.router.state.location.pathname).toBe(from)
        );
        expect(application.store.get(application.session.snapshotAtom)).toBe(
          snapshot
        );
        expect(application.store.get(adminSelectionAtom)).toStrictEqual(
          selection
        );
        expect(get.mock.calls.some(([id]) => id === "two")).toBeFalsy();
      }
    );

    it("does not let a preloaded detail steal visible data or skip its eventual load", async () => {
      const { application, get } = setup();
      render(<AdminApplicationProvider application={application} />);
      await screen.findByRole("heading", { name: "Records" });
      const initial = application.store.get(application.session.snapshotAtom);
      application.store.set(adminSelectionAtom, {
        entity: "records",
        ids: ["one"],
      });
      await act(async () => {
        await application.router.preloadRoute({ to: "/records/two" });
      });
      expect(application.store.get(application.session.snapshotAtom)).toBe(
        initial
      );
      expect(application.store.get(adminSelectionAtom)?.ids).toStrictEqual([
        "one",
      ]);
      expect(get).not.toHaveBeenCalled();
      await act(async () => {
        await application.router.navigate({ to: "/records/two" });
      });
      await screen.findByRole("heading", { name: "two" });
      expect(get).toHaveBeenCalledOnce();
      expect(application.store.get(adminSelectionAtom)).toBeNull();
    });

    it("cancels a superseded loader and never publishes a late adapter result", async () => {
      const held = Promise.withResolvers<{ id: string; label: string }>();
      const get = vi.fn<Adapter["get"]>((id) =>
        id === "slow" ? held.promise : Promise.resolve({ id, label: id })
      );
      const { application } = setup(get);
      render(<AdminApplicationProvider application={application} />);
      await screen.findByRole("heading", { name: "Records" });
      let first: Promise<void>;
      act(() => {
        first = application.router.navigate({ to: "/records/slow" });
      });
      await waitFor(() =>
        expect(get).toHaveBeenCalledWith(
          "slow",
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        )
      );
      await act(async () => {
        await application.router.navigate({ to: "/records/fast" });
      });
      await screen.findByRole("heading", { name: "fast" });
      await act(async () => {
        held.resolve({ id: "slow", label: "Stale" });
        await first;
      });
      expect(
        application.store.get(application.session.snapshotAtom).items[0]?.id
      ).toBe("fast");
      expect(application.session.diagnostics().pendingRequests).toBe(0);
    });

    it("loads through the router before a React tree is mounted and clears unknown routes", async () => {
      const { application, list } = setup();
      await application.router.load();
      expect(list).toHaveBeenCalledOnce();
      expect(
        application.store.get(application.session.snapshotAtom).status
      ).toBe("ready");
      await application.router.navigate({
        to: "/outside/the/admin/route/tree",
      });
      expect(
        application.store.get(application.session.snapshotAtom).items
      ).toStrictEqual([]);
      expect(application.session.diagnostics().activeRecords).toBe(0);
      application.dispose();
      expect(application.session.diagnostics()).toMatchObject({
        cacheEntries: 0,
        disposed: true,
        expiryScheduled: false,
        subscriptions: 0,
      });
    });
  }
);
