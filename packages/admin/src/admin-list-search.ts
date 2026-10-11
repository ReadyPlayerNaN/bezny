import type {
  AdminEntityDefinition,
  AdminListQuery,
} from "./admin-data-adapter.js";

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
  entity: Pick<AdminEntityDefinition, "pageSize" | "filters">,
  maxPageSize: number,
  locale: string
): AdminListQuery => {
  const parameters = searchRecord(search);
  const suppliedFilters = searchRecord(parameters.filters);
  const filters = Object.fromEntries(
    (entity.filters ?? []).flatMap((filter) => {
      const value = Object.hasOwn(suppliedFilters, filter.key)
        ? suppliedFilters[filter.key]
        : undefined;
      if (typeof value !== "string") {
        return [];
      }
      const normalized = value.trim();
      if (
        !normalized ||
        normalized.length > 200 ||
        (filter.options &&
          !filter.options.some((option) => option.value === normalized))
      ) {
        return [];
      }
      return [[filter.key, normalized]];
    })
  );
  return {
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
  entity: Pick<AdminEntityDefinition, "pageSize">,
  current: unknown = {}
): Record<string, unknown> => {
  const parameters = { ...searchRecord(current) };
  delete parameters.page;
  delete parameters.pageSize;
  delete parameters.filters;
  return {
    ...parameters,
    ...(query.page === 1 ? {} : { page: query.page }),
    ...(query.pageSize === (entity.pageSize ?? 25)
      ? {}
      : { pageSize: query.pageSize }),
    ...(Object.keys(query.filters).length ? { filters: query.filters } : {}),
  };
};
