import { DirectionProvider } from "@radix-ui/react-direction";
import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import type { i18n } from "i18next";
import { createStore } from "jotai";
import type { ReactNode, FunctionComponent } from "react";
import { useEffect } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";

import type { AdminBuildingBlockOverrides } from "./admin-building-blocks.js";
import type { AdminEntityDefinition } from "./admin-data-adapter.js";
import { createAdminDataSession } from "./admin-data-session.js";
import type { AdminCachePolicy } from "./admin-data-session.js";
import { useAdminEntityCommands } from "./admin-entity-commands.js";
import {
  AdminEntityRegistryProvider,
  useAdminEntityContext,
  useAdminEntityPresentation,
  useAdminDataSession,
} from "./admin-entity-context.js";
import {
  adminSelectionAtom,
  createAdminEntityRegistry,
} from "./admin-entity-model.js";
import type { AdminStore, AdminEntityView } from "./admin-entity-model.js";
import {
  adminEntityPaths,
  adminEntityViewForRoute,
} from "./admin-entity-paths.js";
import { createAdminI18n } from "./admin-i18n.js";
import { AdminProvider } from "./admin-provider.js";

const AdminDataBoundary = ({ Root }: { Root: FunctionComponent }) => {
  const { request } = useAdminEntityContext();
  const session = useAdminDataSession();
  useEffect(() => {
    void session.activate(request);
  }, [request, session]);
  return <Root />;
};

const EntityScreen = () => {
  const { entity, view, kind } = useAdminEntityContext();
  const { refresh } = useAdminEntityCommands();
  const { t } = useTranslation("beznyAdmin");
  const { NotFound } = useAdminEntityPresentation();
  const Screen = entity && view ? entity.screens[view] : undefined;
  if (Screen && view === "list" && kind !== "unavailable") {
    return <Screen />;
  }
  if (kind === "loading") {
    return <output aria-label={t("loading")}>{t("loading")}</output>;
  }
  if (kind === "error") {
    return (
      <>
        <p role="alert">{t("error")}</p>
        {refresh && (
          <button
            type="button"
            onClick={async () => {
              await refresh.execute();
            }}
          >
            {refresh.label}
          </button>
        )}
      </>
    );
  }
  if (!Screen || kind === "unavailable") {
    return <NotFound />;
  }
  return <Screen />;
};

export interface AdminApplicationOptions {
  entities: readonly AdminEntityDefinition[];
  cache?: Partial<AdminCachePolicy>;
  Root: FunctionComponent;
  NotFound: FunctionComponent;
  history?: RouterHistory;
  store?: AdminStore;
  i18n?: i18n;
}

export const createAdminApplication = ({
  entities,
  Root,
  NotFound,
  history = createBrowserHistory(),
  store = createStore(),
  cache,
  i18n: translations = createAdminI18n(),
}: AdminApplicationOptions) => {
  const registry = createAdminEntityRegistry(entities);
  const session = createAdminDataSession(registry, store, cache);
  if (
    registry.entities.some(
      (entity) => (entity.pageSize ?? 25) > session.policy.maxPageSize
    )
  ) {
    throw new Error("Entity page size exceeds application maximum.");
  }
  const ApplicationRoot = () => <AdminDataBoundary Root={Root} />;
  const [firstEntity] = registry.entities;
  if (!firstEntity) {
    throw new Error("An admin application requires an entity.");
  }
  const root = createRootRoute({
    component: ApplicationRoot,
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
  return {
    NotFound,
    dispose: session.dispose,
    i18n: translations,
    registry,
    router,
    session,
    store,
  };
};
export type AdminApplication = ReturnType<typeof createAdminApplication>;

const AdminLanguageBoundary = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const direction = i18n.dir(language);
  return (
    <DirectionProvider dir={direction}>
      <div lang={language} dir={direction}>
        {children}
      </div>
    </DirectionProvider>
  );
};
export const AdminApplicationProvider = ({
  application,
  components,
}: {
  application: AdminApplication;
  components?: AdminBuildingBlockOverrides;
}) => {
  useEffect(() => {
    const unsubscribe = application.router.subscribe("onResolved", () => {
      const match = application.router.state.matches.at(-1);
      const selection = application.store.get(adminSelectionAtom);
      if (
        selection &&
        (adminEntityViewForRoute(match?.routeId) !== "list" ||
          match?.params.entity !== selection.entity)
      ) {
        application.store.set(adminSelectionAtom, null);
      }
    });
    const unregister = application.session.onDispose(unsubscribe);
    return () => {
      unregister();
      unsubscribe();
      application.session.pause();
    };
  }, [application]);
  return (
    <I18nextProvider i18n={application.i18n}>
      <AdminLanguageBoundary>
        <AdminEntityRegistryProvider
          registry={application.registry}
          session={application.session}
          NotFound={application.NotFound}
        >
          <AdminProvider
            router={application.router}
            store={application.store}
            {...(components ? { components } : {})}
          />
        </AdminEntityRegistryProvider>
      </AdminLanguageBoundary>
    </I18nextProvider>
  );
};
