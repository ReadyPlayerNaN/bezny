import { useRouterState } from "@tanstack/react-router";
import { atom, useAtomValue } from "jotai";
import { createContext, useContext, useMemo } from "react";
import type { FunctionComponent, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { AdminListQuery } from "./admin-data-adapter.js";
import {
  adminDataRequestKey,
  defaultAdminListQuery,
} from "./admin-data-session.js";
import type {
  AdminDataSession,
  AdminDataSnapshot,
} from "./admin-data-session.js";
import { adminSelectionAtom } from "./admin-entity-model.js";
import type {
  AdminEntityRegistry,
  AdminEntity,
  AdminEntityView,
  AdminRecordReference,
  AdminSelection,
} from "./admin-entity-model.js";
import { adminListQueriesAtom } from "./admin-list-state.js";
import {
  adminRouteLocation,
  useAdminRouteBindings,
} from "./admin-route-bindings.js";

const RegistryContext = createContext<AdminEntityRegistry | null>(null);
const DataSessionContext = createContext<AdminDataSession | null>(null);
export const useAdminDataSession = (): AdminDataSession => {
  const session = useContext(DataSessionContext);
  if (!session) {
    throw new Error("Data adapters require AdminApplicationProvider.");
  }
  return session;
};
const emptyRecordsAtom = atom<readonly AdminRecordReference[]>([]);
const DefaultEntityUnavailable = () => {
  const { t } = useTranslation("beznyAdmin");
  return <p>{t("unavailable")}</p>;
};
const NotFoundContext = createContext<{ NotFound: FunctionComponent }>({
  NotFound: DefaultEntityUnavailable,
});
export const useAdminEntityPresentation = () => useContext(NotFoundContext);

export const AdminEntityRegistryProvider = ({
  registry,
  children,
  NotFound,
  session,
}: {
  registry: AdminEntityRegistry;
  session: AdminDataSession;
  children: ReactNode;
  NotFound: FunctionComponent;
}) => {
  const presentation = useMemo(() => ({ NotFound }), [NotFound]);
  return (
    <RegistryContext.Provider value={registry}>
      <DataSessionContext.Provider value={session}>
        <NotFoundContext.Provider value={presentation}>
          {children}
        </NotFoundContext.Provider>
      </DataSessionContext.Provider>
    </RegistryContext.Provider>
  );
};

export const useAdminEntityRegistry = (): AdminEntityRegistry => {
  const original = useContext(RegistryContext);
  const { t } = useTranslation("beznyAdmin");
  const registry = useMemo(() => {
    if (!original) {
      return null;
    }
    const entities = original.entities.map((entity) => ({
      ...entity,
      label: t(entity.labelKey ?? entity.label, { defaultValue: entity.label }),
      singularLabel: t(entity.singularLabelKey ?? entity.singularLabel, {
        defaultValue: entity.singularLabel,
      }),
      ...(entity.filters
        ? {
            filters: entity.filters.map((filter) => ({
              ...filter,
              label: t(filter.labelKey ?? filter.label, {
                defaultValue: filter.label,
              }),
              ...(filter.options
                ? {
                    options: filter.options.map((option) => ({
                      ...option,
                      label: t(option.labelKey ?? option.label, {
                        defaultValue: option.label,
                      }),
                    })),
                  }
                : {}),
            })),
          }
        : {}),
    }));
    return {
      entities,
      get: (key: string) => entities.find((entity) => entity.key === key),
    };
  }, [original, t]);
  if (!registry) {
    throw new Error("Entity building blocks require AdminApplicationProvider.");
  }
  return registry;
};

const contextKind = (
  entity: AdminEntity | null,
  view: AdminEntityView | null,
  recordId: string | null,
  existingIds: Set<string>,
  selectedIds: readonly string[]
): "collection" | "entity" | "selection" | "unavailable" => {
  if (!entity || !view || !entity.screens[view]) {
    return "unavailable";
  }
  if (view === "list" || view === "create") {
    return selectedIds.length > 0 ? "selection" : "collection";
  }
  return recordId && existingIds.has(recordId) ? "entity" : "unavailable";
};

const selectedReferences = (
  entity: AdminEntity | null,
  view: AdminEntityView | null,
  selection: AdminSelection | null,
  existingIds: Set<string>
) => {
  if (view !== "list" || !entity || selection?.entity !== entity.key) {
    return [];
  }
  return [...new Set(selection.ids)].filter((id) => existingIds.has(id));
};
const queryForEntity = (
  entity: AdminEntity | null,
  queries: Readonly<Record<string, AdminListQuery>>
) => {
  const configured =
    entity && Object.hasOwn(queries, entity.key)
      ? queries[entity.key]
      : undefined;
  return (
    configured ?? {
      ...defaultAdminListQuery,
      pageSize: entity?.pageSize ?? defaultAdminListQuery.pageSize,
    }
  );
};
const dataContextKind = (
  base: ReturnType<typeof contextKind>,
  entity: AdminEntity | null,
  view: AdminEntityView | null,
  data: AdminDataSnapshot,
  key: string
): ReturnType<typeof contextKind> | "loading" | "error" => {
  if (!entity || !view || !entity.screens[view]) {
    return base;
  }
  if (data.status === "disposed") {
    return "error";
  }
  if (view === "create") {
    return base;
  }
  if (data.key !== key || data.status === "idle" || data.status === "loading") {
    return "loading";
  }
  if (data.status === "error") {
    return "error";
  }
  return base;
};

const entityContextScope = (
  entity: AdminEntity | null,
  view: AdminEntityView | null,
  recordId: string | null
) => `${entity?.key ?? ""}:${view ?? ""}:${recordId ?? ""}`;

/** Entity context comes from the matched route, never from parsing a URL. */
export const useAdminEntityContext = () => {
  const registry = useAdminEntityRegistry();
  const bindings = useAdminRouteBindings();
  const match = useRouterState({ select: (state) => state.matches.at(-1) });
  const location = adminRouteLocation(bindings, match);
  const entityKey = location?.entity;
  const recordId =
    location && "recordId" in location ? location.recordId : null;
  const entity = entityKey ? (registry.get(entityKey) ?? null) : null;
  const view = location?.view ?? null;
  const records = useAtomValue(entity?.records ?? emptyRecordsAtom);
  const selection = useAtomValue(adminSelectionAtom);
  const existingIds = new Set(records.map((record) => record.id));
  const selectedIds = selectedReferences(entity, view, selection, existingIds);
  const session = useAdminDataSession();
  const data = useAtomValue(session.snapshotAtom);
  const queries = useAtomValue(adminListQueriesAtom);
  const { i18n } = useTranslation("beznyAdmin");
  const query = {
    ...queryForEntity(entity, queries),
    locale: i18n.resolvedLanguage ?? i18n.language ?? "en",
  };
  const request =
    entity && view
      ? { entity: entity.key, view, ...(recordId ? { recordId } : {}), query }
      : null;
  const key = request ? adminDataRequestKey(request) : "";
  const kind = dataContextKind(
    contextKind(entity, view, recordId, existingIds, selectedIds),
    entity,
    view,
    data,
    key
  );
  return {
    data: data.key === key ? data : null,
    entity,
    kind,
    query,
    recordId,
    records: kind === "loading" || kind === "error" ? [] : records,
    request,
    scope: entityContextScope(entity, view, recordId),
    selectedIds: kind === "selection" ? selectedIds : [],
    view,
  };
};
