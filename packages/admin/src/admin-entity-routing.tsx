import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import { createStore } from "jotai";
import type { FunctionComponent } from "react";

import type { AdminBuildingBlockOverrides } from "./admin-building-blocks.js";
import {
  AdminEntityRegistryProvider,
  useAdminEntityContext,
  useAdminEntityPresentation,
} from "./admin-entity-context.js";
import {
  adminSelectionAtom,
  createAdminEntityRegistry,
} from "./admin-entity-model.js";
import type {
  AdminEntity,
  AdminStore,
  AdminEntityView,
} from "./admin-entity-model.js";
import {
  adminEntityPaths,
  adminEntityViewForRoute,
} from "./admin-entity-paths.js";
import { AdminProvider } from "./admin-provider.js";

const EntityScreen = () => {
  const { entity, view, kind } = useAdminEntityContext();
  const { NotFound } = useAdminEntityPresentation();
  const Screen = entity && view ? entity.screens[view] : undefined;
  if (!Screen || kind === "unavailable") {
    return <NotFound />;
  }
  return <Screen />;
};

export interface AdminApplicationOptions {
  entities: readonly AdminEntity[];
  Root: FunctionComponent;
  NotFound: FunctionComponent;
  history?: RouterHistory;
  store?: AdminStore;
}

export const createAdminApplication = ({
  entities,
  Root,
  NotFound,
  history = createBrowserHistory(),
  store = createStore(),
}: AdminApplicationOptions) => {
  const registry = createAdminEntityRegistry(entities);
  for (const entity of registry.entities) {
    const ids = new Set<string>();
    for (const record of store.get(entity.records)) {
      if (!record.id || record.id === "create") {
        throw new Error(
          `Invalid or reserved record ID for ${entity.key}: ${record.id}`
        );
      }
      if (ids.has(record.id)) {
        throw new Error(`Duplicate record ID for ${entity.key}: ${record.id}`);
      }
      ids.add(record.id);
    }
  }
  const [firstEntity] = registry.entities;
  if (!firstEntity) {
    throw new Error("An admin application requires an entity.");
  }
  const root = createRootRoute({
    component: Root,
    notFoundComponent: NotFound,
  });
  const index = createRoute({
    beforeLoad: () => {
      throw redirect({
        params: { entity: firstEntity.key },
        to: adminEntityPaths.list,
      });
    },
    getParentRoute: () => root,
    path: "/",
  });
  const routeFor = (view: AdminEntityView) =>
    createRoute({
      component: EntityScreen,
      getParentRoute: () => root,
      path: adminEntityPaths[view],
    });
  const unavailable = createRoute({
    component: EntityScreen,
    getParentRoute: () => root,
    path: "$",
  });
  const routeTree = root.addChildren([
    index,
    unavailable,
    routeFor("list"),
    routeFor("create"),
    routeFor("detail"),
    routeFor("update"),
  ]);
  const router = createRouter({ history, routeTree });
  router.subscribe("onResolved", () => {
    const match = router.state.matches.at(-1);
    const selection = store.get(adminSelectionAtom);
    if (
      selection &&
      (adminEntityViewForRoute(match?.routeId) !== "list" ||
        match?.params.entity !== selection.entity)
    ) {
      store.set(adminSelectionAtom, null);
    }
  });
  return { NotFound, registry, router, store };
};
export type AdminApplication = ReturnType<typeof createAdminApplication>;

export const AdminApplicationProvider = ({
  application,
  components,
}: {
  application: AdminApplication;
  components?: AdminBuildingBlockOverrides;
}) => (
  <AdminEntityRegistryProvider
    registry={application.registry}
    NotFound={application.NotFound}
  >
    <AdminProvider
      router={application.router}
      store={application.store}
      {...(components ? { components } : {})}
    />
  </AdminEntityRegistryProvider>
);
