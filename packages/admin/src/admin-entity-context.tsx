import { useParams, useRouterState } from "@tanstack/react-router";
import { atom, useAtomValue } from "jotai";
import { createContext, useContext, useMemo } from "react";
import type { FunctionComponent, ReactNode } from "react";

import { adminSelectionAtom } from "./admin-entity-model.js";
import type {
  AdminEntityRegistry,
  AdminEntity,
  AdminEntityView,
  AdminRecordReference,
} from "./admin-entity-model.js";
import { adminEntityViewForRoute } from "./admin-entity-paths.js";

const RegistryContext = createContext<AdminEntityRegistry | null>(null);
const emptyRecordsAtom = atom<readonly AdminRecordReference[]>([]);
const DefaultEntityUnavailable = () => <p>Entity unavailable.</p>;
const NotFoundContext = createContext<{ NotFound: FunctionComponent }>({
  NotFound: DefaultEntityUnavailable,
});
export const useAdminEntityPresentation = () => useContext(NotFoundContext);

export const AdminEntityRegistryProvider = ({
  registry,
  children,
  NotFound,
}: {
  registry: AdminEntityRegistry;
  children: ReactNode;
  NotFound: FunctionComponent;
}) => {
  const presentation = useMemo(() => ({ NotFound }), [NotFound]);
  return (
    <RegistryContext.Provider value={registry}>
      <NotFoundContext.Provider value={presentation}>
        {children}
      </NotFoundContext.Provider>
    </RegistryContext.Provider>
  );
};

export const useAdminEntityRegistry = (): AdminEntityRegistry => {
  const registry = useContext(RegistryContext);
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

/** Entity context comes from the matched route, never from parsing a URL. */
export const useAdminEntityContext = () => {
  const registry = useAdminEntityRegistry();
  const params = useParams({ shouldThrow: false, strict: false });
  const routeId = useRouterState({
    select: (state): string | undefined => state.matches.at(-1)?.routeId,
  });
  const entityKey =
    typeof params?.entity === "string" ? params.entity : undefined;
  const recordId =
    typeof params?.recordId === "string" ? params.recordId : null;
  const entity = entityKey ? (registry.get(entityKey) ?? null) : null;
  const view = adminEntityViewForRoute(routeId);
  const records = useAtomValue(entity?.records ?? emptyRecordsAtom);
  const selection = useAtomValue(adminSelectionAtom);
  const existingIds = new Set(records.map((record) => record.id));
  const selectedIds =
    view === "list" && selection && entity && selection.entity === entity.key
      ? selection.ids.filter((id) => existingIds.has(id))
      : [];
  const kind = contextKind(entity, view, recordId, existingIds, selectedIds);
  return {
    entity,
    kind,
    recordId,
    records,
    scope: `${entity?.key ?? ""}:${view ?? ""}:${recordId ?? ""}`,
    selectedIds,
    view,
  };
};
