import { DirectionProvider } from "@radix-ui/react-direction";
import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import type { AnyRouter, RouterHistory } from "@tanstack/react-router";
import type { i18n } from "i18next";
import type { ReactNode, FunctionComponent } from "react";
import { useEffect } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";

import { createAdminRuntime } from "./admin-application-runtime.js";
import type { AdminRuntime } from "./admin-application-runtime.js";
import type { AdminBuildingBlockOverrides } from "./admin-building-blocks.js";
import type { AdminEntityDefinition } from "./admin-data-adapter.js";
import type { AdminCachePolicy } from "./admin-data-session.js";
import {
  AdminDefaultLoadingPage,
  AdminDefaultUnavailablePage,
} from "./admin-default-pages.js";
import { AdminDeleteDialog } from "./admin-delete-dialog.js";
import {
  AdminEntityRegistryProvider,
  useAdminEntityContext,
  useAdminEntityPresentation,
} from "./admin-entity-context.js";
import type { AdminStore, AdminEntityView } from "./admin-entity-model.js";
import { adminEntityPaths } from "./admin-entity-paths.js";
import { AdminProvider } from "./admin-provider.js";
import type { AdminProviderProps } from "./admin-provider.js";
import { AdminRouteBindingsContext } from "./admin-route-bindings.js";
import type { AdminToastOptions } from "./admin-toasts.js";

const EntityScreenContent = () => {
  const { entity, view, kind } = useAdminEntityContext();
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
    return <p role="alert">{t("error")}</p>;
  }
  if (!Screen || kind === "unavailable") {
    return <NotFound />;
  }
  return <Screen />;
};

export const AdminEntityScreen = () => {
  const { scope } = useAdminEntityContext();
  return (
    <>
      <EntityScreenContent />
      <AdminDeleteDialog key={scope} />
    </>
  );
};

export {
  AdminDefaultListPage,
  AdminDefaultDetailPage,
  AdminDefaultFormPage,
  AdminDefaultLoadingPage,
  AdminDefaultUnavailablePage,
} from "./admin-default-pages.js";

export interface AdminApplicationOptions {
  entities: readonly AdminEntityDefinition[];
  cache?: Partial<AdminCachePolicy>;
  realtime?: boolean;
  Root: FunctionComponent;
  NotFound?: FunctionComponent;
  history?: RouterHistory;
  store?: AdminStore;
  i18n?: i18n;
}

export const createAdminApplication = ({
  entities,
  Root,
  NotFound = AdminDefaultUnavailablePage,
  history = createBrowserHistory(),
  store,
  cache,
  realtime = true,
  i18n: translations,
}: AdminApplicationOptions) => {
  const runtime = createAdminRuntime({
    NotFound,
    entities,
    realtime,
    ...(store ? { store } : {}),
    ...(cache ? { cache } : {}),
    ...(translations ? { i18n: translations } : {}),
  });
  const [firstEntity] = runtime.registry.entities;
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
      component: AdminEntityScreen,
      getParentRoute: () => root,
      loader: runtime.loader(view),
      path: adminEntityPaths[view],
      pendingComponent: AdminDefaultLoadingPage,
      pendingMinMs: 0,
      pendingMs: 0,
    });
  const unavailable = createRoute({
    component: AdminEntityScreen,
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
  return runtime.attach(router);
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
const LocalizedAdminProvider = ({
  toasts,
  ...props
}: AdminProviderProps<AnyRouter>) => {
  const { t } = useTranslation("beznyAdmin");
  return (
    <AdminProvider
      {...props}
      toasts={{
        dismissLabel: t("notifications.dismiss"),
        label: t("notifications.label"),
        viewportLabel: t("notifications.viewport"),
        ...toasts,
      }}
    />
  );
};

export const AdminApplicationProvider = ({
  application,
  components,
  toasts,
}: {
  application: AdminRuntime & { router: AnyRouter };
  components?: AdminBuildingBlockOverrides;
  toasts?: AdminToastOptions;
}) => {
  useEffect(() => {
    application.connect();
    return application.pause;
  }, [application]);
  return (
    <I18nextProvider i18n={application.i18n}>
      <AdminLanguageBoundary>
        <AdminEntityRegistryProvider
          registry={application.registry}
          session={application.session}
          NotFound={application.NotFound}
        >
          <AdminRouteBindingsContext.Provider value={application.routes}>
            <LocalizedAdminProvider
              router={application.router}
              store={application.store}
              toasts={toasts}
              {...(components ? { components } : {})}
            />
          </AdminRouteBindingsContext.Provider>
        </AdminEntityRegistryProvider>
      </AdminLanguageBoundary>
    </I18nextProvider>
  );
};
