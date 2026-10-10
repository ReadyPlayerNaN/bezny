import { useNavigate, useRouter } from "@tanstack/react-router";
import { atom, useAtomValue, useSetAtom, useStore } from "jotai";
import { useCallback, useEffect, useId, useMemo } from "react";

import {
  useAdminEntityContext,
  useAdminEntityRegistry,
  useAdminDataSession,
} from "./admin-entity-context.js";
import {
  adminPageCommandsAtom,
  adminSelectionAtom,
} from "./admin-entity-model.js";
import type {
  AdminActionScope,
  AdminCommand,
  AdminEntity,
  AdminEntityAction,
  AdminEntityNavigate,
  AdminRecordReference,
} from "./admin-entity-model.js";
import {
  adminEntityPaths,
  adminEntityViewForRoute,
} from "./admin-entity-paths.js";

export const useAdminEntityNavigate = (): AdminEntityNavigate => {
  const navigate = useNavigate();
  return useCallback(
    async (location) => {
      if ("recordId" in location) {
        if (
          !location.recordId ||
          location.recordId.toLowerCase() === "create"
        ) {
          throw new Error(
            'Record IDs must be non-empty; "create" is reserved for the create page.'
          );
        }
        await navigate({
          params: { entity: location.entity, recordId: location.recordId },
          to: adminEntityPaths[location.view],
        });
      } else {
        await navigate({
          params: { entity: location.entity },
          to: adminEntityPaths[location.view],
        });
      }
    },
    [navigate]
  );
};

const routeCommand = (
  entity: AdminEntity,
  view: "list" | "create",
  navigate: AdminEntityNavigate
): AdminCommand => ({
  execute: () => navigate({ entity: entity.key, view }),
  id: `${entity.key}.${view}`,
  label:
    view === "list"
      ? `List ${entity.label.toLocaleLowerCase()}`
      : `Create ${entity.singularLabel.toLocaleLowerCase()}`,
  location: { entity: entity.key, view },
});

const actionCommand = (
  action: AdminEntityAction,
  scope: AdminActionScope
): AdminCommand => ({
  id: `${scope.entity.key}.action.${action.id}.${JSON.stringify(scope.ids)}`,
  label: action.label(scope),
  ...(action.destructive ? { destructive: true } : {}),
  execute: () => {
    // Revalidate availability and target existence, including stale palette items.
    const targetIds = new Set(scope.ids);
    const availableRecords = scope.store.get(scope.entity.records);
    const records = availableRecords.filter((record) =>
      targetIds.has(record.id)
    );
    if (action.target === "selection") {
      const selection = scope.store.get(adminSelectionAtom);
      const existingIds = new Set(availableRecords.map((record) => record.id));
      const selectedIds =
        selection?.entity === scope.entity.key
          ? selection.ids.filter((id) => existingIds.has(id))
          : [];
      if (
        selectedIds.length !== scope.ids.length ||
        !selectedIds.every((id) => targetIds.has(id))
      ) {
        return;
      }
    }
    if (records.length !== scope.ids.length) {
      return;
    }
    const current = { ...scope, records };
    if (action.enabled && !scope.store.get(action.enabled)) {
      return;
    }
    if (action.isAvailable && !action.isAvailable(current)) {
      return;
    }
    return action.execute(current);
  },
});

/** A single command catalog serves navigation, records, selection, and palette. */
export const useAdminEntityCommands = () => {
  const registry = useAdminEntityRegistry();
  const enabledSnapshot = useMemo(
    () =>
      atom((get) =>
        registry.entities
          .flatMap((entity) =>
            (entity.actions ?? []).map((action) =>
              action.enabled ? get(action.enabled) : true
            )
          )
          .join(",")
      ),
    [registry]
  );
  // Subscribe to reactive action permissions without conditionally calling hooks.
  useAtomValue(enabledSnapshot);
  const context = useAdminEntityContext();
  const session = useAdminDataSession();
  const refresh: AdminCommand | null =
    context.entity &&
    context.view &&
    context.entity.screens[context.view] &&
    context.view !== "create"
      ? {
          execute: session.refresh,
          id: `${context.entity.key}.refresh`,
          label:
            context.kind === "error"
              ? "Retry loading records"
              : "Refresh records",
        }
      : null;
  const navigate = useAdminEntityNavigate();
  const store = useStore();
  const router = useRouter();
  const setSelection = useSetAtom(adminSelectionAtom);
  const registeredPageCommands = useAtomValue(adminPageCommandsAtom);
  const navigationCommands = registry.entities.flatMap((entity) => [
    routeCommand(entity, "list", navigate),
    ...(entity.screens.create
      ? [routeCommand(entity, "create", navigate)]
      : []),
  ]);
  const entity = context.entity ?? registry.entities[0];
  if (!entity) {
    throw new Error("No registered admin entity.");
  }
  const list = routeCommand(entity, "list", navigate);
  const create = entity.screens.create
    ? routeCommand(entity, "create", navigate)
    : null;
  const customCommands = (
    target: "record" | "selection",
    records: readonly AdminRecordReference[]
  ): AdminCommand[] => {
    if (
      !context.view ||
      records.length === 0 ||
      context.kind === "loading" ||
      context.kind === "error" ||
      context.kind === "unavailable"
    ) {
      return [];
    }
    const scope: AdminActionScope = {
      entity,
      ids: records.map((record) => record.id),
      navigate,
      records,
      session,
      store,
      view: context.view,
    };
    return (entity.actions ?? []).flatMap((action) =>
      action.target === target &&
      (!action.enabled || store.get(action.enabled)) &&
      (!action.isAvailable || action.isAvailable(scope))
        ? [actionCommand(action, scope)]
        : []
    );
  };
  const forRecord = (recordId: string): AdminCommand[] => {
    const record = context.records.find((item) => item.id === recordId);
    if (
      !record ||
      record.id === "create" ||
      !context.entity ||
      context.kind === "loading" ||
      context.kind === "error"
    ) {
      return [];
    }
    const routeCommands: AdminCommand[] = [];
    for (const view of ["detail", "update"] as const) {
      if (entity.screens[view]) {
        const location = { entity: entity.key, recordId, view };
        routeCommands.push({
          execute: () => navigate(location),
          id: `${entity.key}.record.${recordId}.${view}`,
          label: `${view === "detail" ? "View" : "Edit"} ${record.label}`,
          location,
        });
      }
    }
    return [...routeCommands, ...customCommands("record", [record])];
  };
  const forSelection = (recordId: string): AdminCommand => {
    const record = context.records.find((item) => item.id === recordId);
    const selected = context.selectedIds.includes(recordId);
    return {
      execute: () => {
        const match = router.state.matches.at(-1);
        if (
          adminEntityViewForRoute(match?.routeId) !== "list" ||
          match?.params.entity !== entity.key
        ) {
          return;
        }
        if (!store.get(entity.records).some((item) => item.id === recordId)) {
          return;
        }
        setSelection((current) => {
          const ids = current?.entity === entity.key ? current.ids : [];
          return {
            entity: entity.key,
            ids: ids.includes(recordId)
              ? ids.filter((id) => id !== recordId)
              : [...ids, recordId],
          };
        });
      },
      id: `${entity.key}.selection.${recordId}.select`,
      label: `${selected ? "Deselect" : "Select"} ${record?.label ?? recordId}`,
    };
  };
  const selectedIds = new Set(context.selectedIds);
  const selectedRecords = context.records.filter((record) =>
    selectedIds.has(record.id)
  );
  const selectionCommands =
    selectedRecords.length > 0
      ? [
          ...customCommands("selection", selectedRecords),
          {
            execute: () =>
              setSelection((current) =>
                current?.entity === entity.key ? null : current
              ),
            id: `${entity.key}.selection.clear`,
            label: "Clear selection",
          },
        ]
      : [];
  let recordCommands: AdminCommand[] = [];
  if (context.view === "list") {
    recordCommands = context.records.flatMap((record) => forRecord(record.id));
  } else if (context.kind === "entity" && context.recordId) {
    recordCommands = forRecord(context.recordId);
  }
  const pageCommands =
    registeredPageCommands?.scope === context.scope
      ? registeredPageCommands.commands
      : [];
  return {
    create,
    forRecord,
    forSelection,
    list,
    navigationCommands,
    pageCommands,
    paletteCommands: [
      ...navigationCommands,
      ...recordCommands,
      ...selectionCommands,
      ...(context.view === "list"
        ? context.records.map((record) => forSelection(record.id))
        : []),
      ...pageCommands,
      ...(refresh ? [refresh] : []),
    ],
    refresh,
    selectionCommands,
  };
};

/** Register memoized screen commands; they leave the palette when the screen leaves. */
export const useAdminPageCommands = (
  commands: readonly AdminCommand[]
): void => {
  const { scope } = useAdminEntityContext();
  const owner = useId();
  const setRegistration = useSetAtom(adminPageCommandsAtom);
  const store = useStore();
  useEffect(() => {
    const guarded: readonly AdminCommand[] = commands.map((command) => ({
      ...command,
      execute: () => {
        const current = store.get(adminPageCommandsAtom);
        if (
          current?.owner === owner &&
          current.scope === scope &&
          current.commands === guarded
        ) {
          return command.execute();
        }
      },
    }));
    setRegistration({ commands: guarded, owner, scope });
    return () => {
      setRegistration((current) =>
        current?.commands === guarded ? null : current
      );
    };
  }, [commands, owner, scope, setRegistration, store]);
};
