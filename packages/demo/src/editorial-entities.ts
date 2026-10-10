import type { AdminActionScope, AdminEntity } from "@bezny/admin/entities";
import { selectAtom } from "jotai/utils";

import {
  EditorialCreatePage,
  EditorialDetailPage,
  EditorialListPage,
  EditorialUpdatePage,
} from "./editorial-pages.js";
import {
  deletionRequestAtom,
  editorialResources,
} from "./editorial-records.js";

const requestDeletion = (scope: AdminActionScope) => {
  scope.store.set(deletionRequestAtom, {
    entity: scope.entity.key,
    ids: scope.ids,
    returnFocus:
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null,
  });
};

/** Register a resource once. No entity-specific route or palette entries. */
export const editorialEntities: AdminEntity[] = editorialResources.map(
  (resource) => ({
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
    key: resource.key,
    label: resource.label,
    records: selectAtom(
      resource.records,
      (records) =>
        records.map((record) => ({ id: record.id, label: record.title })),
      (previous, next) =>
        previous.length === next.length &&
        previous.every(
          (record, index) =>
            record.id === next[index]?.id && record.label === next[index]?.label
        )
    ),
    screens: {
      create: EditorialCreatePage,
      detail: EditorialDetailPage,
      list: EditorialListPage,
      update: EditorialUpdatePage,
    },
    singularLabel: resource.singularLabel,
  })
);
