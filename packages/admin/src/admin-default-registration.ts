import type { AdminEntityDefinition } from "./admin-data-adapter.js";
import {
  AdminDefaultListPage,
  AdminDefaultDetailPage,
  AdminDefaultFormPage,
} from "./admin-default-pages.js";
import { adminDeletionRequestAtom } from "./admin-delete-dialog.js";
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
const validateEntityFields = (definition: AdminEntityDefinition) => {
  const fields = new Set<string>();
  for (const field of definition.form?.fields ?? []) {
    if (
      !/^[a-zA-Z][a-zA-Z0-9_-]*$/u.test(field.key) ||
      fields.has(field.key) ||
      ["constructor", "prototype", "__proto__"].includes(field.key)
    ) {
      throw new Error(
        `Invalid or duplicate field ${field.key} for ${definition.key}`
      );
    }
    if (
      field.type === "select" &&
      (!field.options?.length ||
        new Set(field.options.map((option) => option.value)).size !==
          field.options.length ||
        field.options.some((option) => !option.value))
    ) {
      throw new Error(`Invalid choices for ${definition.key}/${field.key}`);
    }
    fields.add(field.key);
  }
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
  validateEntityFields(definition);
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
      detail: AdminDefaultDetailPage,
      list: AdminDefaultListPage,
      ...(definition.form && definition.adapter.create
        ? { create: AdminDefaultFormPage }
        : {}),
      ...(definition.form && definition.adapter.update
        ? { update: AdminDefaultFormPage }
        : {}),
      ...definition.screens,
    },
  };
};
