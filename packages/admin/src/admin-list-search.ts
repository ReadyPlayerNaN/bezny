import type {
  AdminEntityDefinition,
  AdminListQuery,
} from "./admin-data-adapter.js";
import { normalizeAdminFilterValue } from "./admin-filter-values.js";
import { adminSortKey, readAdminSort } from "./admin-sort-model.js";
import { invalidAdminFilterRanges } from "./admin-typed-filter.js";

const searchRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const positiveInteger = (
  value: unknown,
  fallback: number,
  maximum = Number.MAX_SAFE_INTEGER
) => {
  const number =
    typeof value === "number" || typeof value === "string"
      ? Number(value)
      : Number.NaN;
  return Number.isSafeInteger(number) && number > 0 && number <= maximum
    ? number
    : fallback;
};

/** Bound untrusted URL input to the registered collection's query contract. */
export const readAdminListSearch = (
  search: unknown,
  entity: Pick<AdminEntityDefinition, "pageSize" | "filters" | "sorting">,
  maxPageSize: number,
  locale: string
): AdminListQuery => {
  const parameters = searchRecord(search);
  const suppliedFilters = searchRecord(parameters.filters);
  const normalizedFilters = Object.fromEntries(
    (entity.filters ?? []).flatMap((filter) => {
      const value = Object.hasOwn(suppliedFilters, filter.key)
        ? suppliedFilters[filter.key]
        : undefined;
      const normalized = normalizeAdminFilterValue(filter, value);
      return normalized ? [[filter.key, normalized]] : [];
    })
  );
  const invalidKeys = new Set(
    invalidAdminFilterRanges(entity.filters ?? [], normalizedFilters).flatMap(
      (filter) => [filter.key, filter.before]
    )
  );
  const filters = Object.fromEntries(
    Object.entries(normalizedFilters).filter(([key]) => !invalidKeys.has(key))
  );
  return {
    ...(entity.sorting
      ? {
          sort:
            readAdminSort(parameters.sort, entity.sorting) ??
            readAdminSort(entity.sorting.default ?? [], entity.sorting) ??
            [],
        }
      : {}),
    filters,
    locale,
    page: positiveInteger(parameters.page, 1),
    pageSize: positiveInteger(
      parameters.pageSize,
      entity.pageSize ?? 25,
      maxPageSize
    ),
  };
};

/** Preserve host search keys, omit collection defaults, and never serialize UI locale. */
export const adminListSearch = (
  query: AdminListQuery,
  entity: Pick<AdminEntityDefinition, "pageSize" | "sorting">,
  current: unknown = {}
): Record<string, unknown> => {
  const parameters = { ...searchRecord(current) };
  delete parameters.page;
  delete parameters.pageSize;
  delete parameters.filters;
  if (entity.sorting) {
    delete parameters.sort;
  }
  return {
    ...parameters,
    ...(query.page === 1 ? {} : { page: query.page }),
    ...(query.pageSize === (entity.pageSize ?? 25)
      ? {}
      : { pageSize: query.pageSize }),
    ...(Object.keys(query.filters).length ? { filters: query.filters } : {}),
    ...(entity.sorting &&
    adminSortKey(query.sort ?? entity.sorting.default) !==
      adminSortKey(entity.sorting.default)
      ? { sort: query.sort ?? entity.sorting.default ?? [] }
      : {}),
  };
};
