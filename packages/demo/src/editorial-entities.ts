import { defineAdminEntity } from "@bezny/admin/adapters";
import type { AdminEntityDefinition } from "@bezny/admin/adapters";
import type { AdminActionScope } from "@bezny/admin/entities";

import {
  EditorialCreatePage,
  EditorialDetailPage,
  EditorialListPage,
  EditorialUpdatePage,
} from "./editorial-pages.js";
import type { EditorialRepository } from "./editorial-records.js";
import {
  deletionRequestAtom,
  editorialResources,
  parseEditorialValues,
} from "./editorial-records.js";

const deletionFocusTarget = (scope: AdminActionScope): HTMLElement | null => {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) {
    return null;
  }
  if (active.closest('[role="menu"]')) {
    for (const row of document.querySelectorAll<HTMLElement>(
      "[data-admin-entity] [data-selection-id]"
    )) {
      if (
        row.dataset.selectionId === scope.ids[0] &&
        row.closest<HTMLElement>("[data-admin-entity]")?.dataset.adminEntity ===
          scope.entity.key
      ) {
        return row;
      }
    }
  }
  return active;
};
const requestDeletion = (scope: AdminActionScope) => {
  scope.store.set(deletionRequestAtom, {
    entity: scope.entity.key,
    ids: scope.ids,
    labels: scope.records.map((record) => record.label),
    returnFocus: deletionFocusTarget(scope),
  });
};

/** Register a resource once. No entity-specific route or palette entries. */
export const createEditorialEntities = (
  repository: EditorialRepository
): AdminEntityDefinition[] =>
  editorialResources.map((resource) =>
    defineAdminEntity({
      actions: [
        {
          destructive: true,
          execute: requestDeletion,
          id: "delete",
          label: (scope) => `Delete ${scope.records[0]?.label ?? "record"}`,
          target: "record",
        },
        {
          destructive: true,
          execute: requestDeletion,
          id: "delete-selected",
          label: (scope) =>
            `Delete selected ${scope.entity.label.toLocaleLowerCase()}`,
          target: "selection",
        },
      ],
      adapter: repository.adapter(resource.key),
      key: resource.key,
      label: resource.label,
      parseValues: parseEditorialValues,
      reference: (record) => ({ id: record.id, label: record.title }),
      screens: {
        create: EditorialCreatePage,
        detail: EditorialDetailPage,
        list: EditorialListPage,
        update: EditorialUpdatePage,
      },
      singularLabel: resource.singularLabel,
    })
  );
