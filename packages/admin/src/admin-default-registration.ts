import type { AdminEntityDefinition } from "./admin-data-adapter.js";
import {
  AdminDefaultListPage,
  AdminDefaultDetailPage,
  AdminDefaultFormPage,
} from "./admin-default-pages.js";
import { adminDeletionRequestAtom } from "./admin-delete-dialog.js";
import {
  resolveAdminEntityForm,
  validateAdminEntityForms,
} from "./admin-entity-fields.js";
import type {
  AdminActionScope,
  AdminEntityAction,
} from "./admin-entity-model.js";

const requestDeletion = (
  scope: AdminActionScope,
  target: "record" | "selection"
) => {
  const active = document.activeElement;
  let returnFocus = active instanceof HTMLElement ? active : null;
  if (returnFocus?.closest('[role="menu"]')) {
    returnFocus =
      [...document.querySelectorAll<HTMLElement>("[data-selection-id]")].find(
        (row) => row.dataset.selectionId === scope.ids[0]
      ) ?? returnFocus;
  }
  scope.store.set(adminDeletionRequestAtom, { returnFocus, scope, target });
};
const deletionLabel = (
  scope: AdminActionScope,
  target: "record" | "selection"
) => {
  if (target === "selection") {
    return (
      scope.translate?.("defaults.deleteSelection", {
        count: scope.ids.length,
        defaultValue: `Delete selected (${scope.ids.length})`,
      }) ?? `Delete selected (${scope.ids.length})`
    );
  }
  const record = scope.records[0]?.label ?? scope.entity.singularLabel;
  return (
    scope.translate?.("defaults.deleteRecord", {
      defaultValue: `Delete ${record}`,
      record,
    }) ?? `Delete ${record}`
  );
};
export const resolveAdminEntityDefinition = (
  definition: AdminEntityDefinition
) => {
  validateAdminEntityForms(definition, definition.key);
  if (
    !definition.adapter.get &&
    (definition.screens?.detail ||
      definition.screens?.update ||
      definition.adapter.update)
  ) {
    throw new Error(
      `Detail and update capabilities require a get adapter: ${definition.key}`
    );
  }
  const actions: AdminEntityAction[] = [...(definition.actions ?? [])];
  if (definition.adapter.remove) {
    for (const target of ["record", "selection"] as const) {
      const id = target === "record" ? "delete" : "delete-selected";
      if (
        !actions.some((action) => action.id === id && action.target === target)
      ) {
        actions.push({
          destructive: true,
          execute: (scope) => requestDeletion(scope, target),
          id,
          label: (scope) => deletionLabel(scope, target),
          ...(target === "record"
            ? {
                menuLabel: (scope: AdminActionScope) =>
                  scope.translate?.("defaults.delete", {
                    defaultValue: "Delete",
                  }) ?? "Delete",
              }
            : {}),
          target,
        });
      }
    }
  }
  return {
    ...definition,
    actions,
    screens: {
      ...(definition.adapter.get ? { detail: AdminDefaultDetailPage } : {}),
      list: AdminDefaultListPage,
      ...(resolveAdminEntityForm(definition, "create") &&
      definition.adapter.create
        ? { create: AdminDefaultFormPage }
        : {}),
      ...(resolveAdminEntityForm(definition, "update") &&
      definition.adapter.update
        ? { update: AdminDefaultFormPage }
        : {}),
      ...definition.screens,
    },
  };
};
