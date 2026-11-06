import type { TFunction } from "i18next";

import type { AdminListQuery } from "./admin-data-adapter.js";
import type { AdminCommand, AdminEntity } from "./admin-entity-model.js";
import { readAdminSortInput } from "./admin-sort-model.js";

export const createAdminSortCommand = (
  entity: AdminEntity | null,
  query: AdminListQuery,
  translate: TFunction,
  update: (query: AdminListQuery) => void | Promise<void>
): AdminCommand | null => {
  if (!entity?.sorting) {
    return null;
  }
  const { sorting } = entity;
  const value = JSON.stringify(query.sort ?? sorting.default ?? []);
  const execute = (input: string) => {
    const sort = readAdminSortInput(input, sorting);
    if (!sort) {
      throw new Error("Invalid sorting rules.");
    }
    return update({ ...query, page: 1, sort });
  };
  return {
    execute: () => execute(value),
    id: `${entity.key}.sort`,
    input: {
      execute,
      label: translate("sorting.label"),
      sorting: {
        ...sorting,
        fields: sorting.fields.map((field) => ({
          ...field,
          label: translate(field.labelKey ?? field.label, {
            defaultValue: field.label,
          }),
        })),
      },
      value,
    },
    label: translate("sorting.label"),
  };
};
