import { defineAdminEntity } from "@bezny/admin/adapters";
import type { AdminEntityDefinition } from "@bezny/admin/adapters";
import type { AdminActionScope } from "@bezny/admin/entities";
import type { i18n } from "i18next";

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
  repository: EditorialRepository,
  translations: i18n
): AdminEntityDefinition[] =>
  editorialResources.map((resource) =>
    defineAdminEntity({
      actions: [
        {
          destructive: true,
          execute: requestDeletion,
          id: "delete",
          label: (scope) =>
            translations.t("editorial:delete", {
              record: scope.records[0]?.label ?? scope.entity.singularLabel,
            }),
          target: "record",
        },
        {
          destructive: true,
          execute: requestDeletion,
          id: "delete-selected",
          label: (scope) =>
            translations.t("editorial:deleteSelection", {
              count: scope.ids.length,
              entity: scope.entity.label.toLocaleLowerCase(),
            }),
          target: "selection",
        },
      ],
      adapter: repository.adapter(resource.key),
      filters: [
        { key: "search", label: "Search", labelKey: "editorial:search" },
        {
          key: "status",
          label: "Status",
          labelKey: "editorial:status",
          options: [
            { label: "Draft", labelKey: "editorial:draft", value: "draft" },
            {
              label: "Published",
              labelKey: "editorial:published",
              value: "published",
            },
          ],
        },
      ],
      key: resource.key,
      label: resource.label,
      labelKey: `editorial:entities.${resource.key}.plural`,
      pageSize: 3,
      parseValues: parseEditorialValues,
      reference: (record) => ({ id: record.id, label: record.title }),
      screens: {
        create: EditorialCreatePage,
        detail: EditorialDetailPage,
        list: EditorialListPage,
        update: EditorialUpdatePage,
      },
      singularLabel: resource.singularLabel,
      singularLabelKey: `editorial:entities.${resource.key}.singular`,
    })
  );
