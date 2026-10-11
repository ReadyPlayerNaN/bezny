import type { AnyRouter } from "@tanstack/react-router";
import type { i18n } from "i18next";
import { createStore } from "jotai";
import type { FunctionComponent } from "react";

import type { AdminEntityDefinition } from "./admin-data-adapter.js";
import {
  adminDataRequestKey,
  createAdminDataSession,
  defaultAdminListQuery,
} from "./admin-data-session.js";
import type { AdminCachePolicy } from "./admin-data-session.js";
import { AdminDefaultUnavailablePage } from "./admin-default-pages.js";
import { registerAdminDefaultTranslations } from "./admin-default-translations.js";
import {
  adminPageCommandsAtom,
  createAdminEntityRegistry,
} from "./admin-entity-model.js";
import type {
  AdminEntityLocation,
  AdminEntityView,
  AdminStore,
} from "./admin-entity-model.js";
import { createAdminI18n } from "./admin-i18n.js";
import { adminListQueriesAtom } from "./admin-list-state.js";
import {
  adminRouteLocation,
  defaultAdminRouteBindings,
} from "./admin-route-bindings.js";
import type { AdminRouteBindings } from "./admin-route-bindings.js";

export interface AdminRuntimeOptions {
  entities: readonly AdminEntityDefinition[];
  NotFound?: FunctionComponent;
  cache?: Partial<AdminCachePolicy>;
  store?: AdminStore;
  i18n?: i18n;
  routes?: AdminRouteBindings;
}

/** One data/command authority, independent of how the host creates its routes. */
export const createAdminRuntime = ({
  entities,
  NotFound = AdminDefaultUnavailablePage,
  cache,
  store = createStore(),
  i18n: translations = createAdminI18n(),
  routes = defaultAdminRouteBindings,
}: AdminRuntimeOptions) => {
  registerAdminDefaultTranslations(translations);
  const registry = createAdminEntityRegistry(entities);
  const session = createAdminDataSession(registry, store, cache);
  const bindings = Object.freeze(
    Object.fromEntries(
      Object.entries(routes).map(([view, binding]) => [
        view,
        Object.freeze({ ...binding }),
      ])
    )
  ) as AdminRouteBindings;
  const routeIds = new Set(Object.values(bindings).map(({ id }) => id));
  if (
    routeIds.size !== 4 ||
    Object.values(bindings).some(({ id, path }) => !id || !path)
  ) {
    throw new Error(
      "Admin routes require four distinct IDs and navigation paths."
    );
  }
  if (
    registry.entities.some(
      (entity) => (entity.pageSize ?? 25) > session.policy.maxPageSize
    )
  ) {
    throw new Error("Entity page size exceeds application maximum.");
  }
  let location: AdminEntityLocation | null = null;
  let destination: AdminEntityLocation | null = null;
  let navigation = 0;
  let pending: Promise<void> = Promise.resolve();
  let activeKey: string | null = null;
  let router: AnyRouter | null = null;
  let disconnect: (() => void) | null = null;
  let paused = false;
  const activate = () => {
    const entity = location ? registry.get(location.entity) : undefined;
    const queries = store.get(adminListQueriesAtom);
    const query =
      entity && Object.hasOwn(queries, entity.key)
        ? queries[entity.key]
        : undefined;
    const request = location
      ? {
          ...location,
          query: {
            ...(query ?? {
              ...defaultAdminListQuery,
              pageSize: entity?.pageSize ?? defaultAdminListQuery.pageSize,
            }),
            locale:
              translations.resolvedLanguage ?? translations.language ?? "en",
          },
        }
      : null;
    const key = request ? adminDataRequestKey(request) : "";
    if (activeKey === key) {
      return pending;
    }
    activeKey = key;
    pending = session.activate(request);
    return pending;
  };
  const select = (next: AdminEntityLocation | null) => {
    location = next;
    return activate();
  };
  const clampPage = () => {
    const snapshot = store.get(session.snapshotAtom);
    if (
      location?.view !== "list" ||
      snapshot.entity !== location.entity ||
      snapshot.status !== "ready"
    ) {
      return;
    }
    const last = Math.max(
      1,
      Math.ceil(snapshot.total / snapshot.query.pageSize)
    );
    const entityKey = snapshot.entity;
    if (entityKey && snapshot.query.page > last) {
      store.set(adminListQueriesAtom, (queries) => ({
        ...queries,
        [entityKey]: { ...snapshot.query, page: last },
      }));
    }
  };
  const languageChanged = () => {
    void activate();
  };
  const connect = () => {
    if (disconnect || !router || session.diagnostics().disposed) {
      return;
    }
    const currentRouter = router;
    const subscriptions = [
      currentRouter.subscribe("onBeforeLoad", (event) => {
        navigation += 1;
        destination = adminRouteLocation(
          bindings,
          currentRouter.matchRoutes(event.toLocation).at(-1)
        );
        // Keep the current screen intact while host guards decide whether
        // navigation is allowed. Only admitted loaders may replace its data.
      }),
      currentRouter.subscribe("onResolved", () => {
        if (!adminRouteLocation(bindings, currentRouter.state.matches.at(-1))) {
          store.set(adminPageCommandsAtom, null);
          void select(null);
        }
      }),
      store.sub(adminListQueriesAtom, () => {
        void activate();
      }),
      store.sub(session.snapshotAtom, clampPage),
    ];
    translations.on("languageChanged", languageChanged);
    const unregister = session.onDispose(() => {
      disconnect?.();
      location = null;
    });
    disconnect = () => {
      unregister();
      for (const unsubscribe of subscriptions) {
        unsubscribe();
      }
      translations.off("languageChanged", languageChanged);
      disconnect = null;
    };
    if (paused) {
      paused = false;
      void currentRouter.invalidate();
    }
  };
  const pause = () => {
    paused = true;
    disconnect?.();
    location = null;
    destination = null;
    navigation += 1;
    activeKey = null;
    session.pause();
  };
  const runtime = {
    NotFound,
    /** Attach exactly one application-owned router; no second route tree is created. */
    attach: <TRouter extends AnyRouter>(host: TRouter) => {
      if (router && router !== host) {
        throw new Error("An admin runtime can only attach to one router.");
      }
      if (session.diagnostics().disposed) {
        throw new Error("The admin application has been disposed.");
      }
      for (const binding of Object.values(bindings)) {
        const route = host.routesById[binding.id];
        if (!route || route.fullPath !== binding.path) {
          throw new Error(
            `Admin route binding does not match the host router: ${binding.id}`
          );
        }
        // Route-loader caching is not the entity cache. In particular, a
        // speculative preload must not suppress activation on real navigation.
        route.update({ preloadStaleTime: 0, shouldReload: true, staleTime: 0 });
      }
      router = host;
      connect();
      return { ...runtime, router: host };
    },
    connect,
    dispose: session.dispose,
    i18n: translations,
    /** Use as a file route's loader. Preloads never mutate visible admin state. */
    loader:
      (view: AdminEntityView) =>
      async ({
        params,
        preload,
        abortController,
      }: {
        params: { entity?: string; recordId?: string };
        preload: boolean;
        abortController?: AbortController;
      }) => {
        if (
          preload ||
          abortController?.signal.aborted ||
          session.diagnostics().disposed
        ) {
          return;
        }
        const next = adminRouteLocation(bindings, {
          params,
          routeId: bindings[view].id,
        });
        if (JSON.stringify(next) !== JSON.stringify(destination)) {
          return;
        }
        if (JSON.stringify(next) !== JSON.stringify(location)) {
          store.set(adminPageCommandsAtom, null);
        }
        const generation = navigation;
        const cancel = () => {
          if (generation === navigation) {
            void select(null);
          }
        };
        abortController?.signal.addEventListener("abort", cancel, {
          once: true,
        });
        try {
          await (JSON.stringify(next) === JSON.stringify(location)
            ? pending
            : select(next));
          // A response can clamp a now-empty last page and start another read.
          // Do not finish the loader until the current navigation has settled.
          let observed: Promise<void>;
          do {
            observed = pending;
            // oxlint-disable-next-line no-await-in-loop -- Wait for response-driven pagination to settle on this navigation.
            await observed;
            if (generation !== navigation || abortController?.signal.aborted) {
              break;
            }
          } while (observed !== pending);
        } finally {
          abortController?.signal.removeEventListener("abort", cancel);
        }
      },
    pause,
    registry,
    routes: bindings,
    session,
    store,
  };
  return runtime;
};
export type AdminRuntime = ReturnType<typeof createAdminRuntime>;
