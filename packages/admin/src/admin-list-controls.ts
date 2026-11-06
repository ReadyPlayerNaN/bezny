import { useRouter } from "@tanstack/react-router";
import { useStore } from "jotai";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { AdminListQuery } from "./admin-data-adapter.js";
import { adminDataRequestKey } from "./admin-data-session.js";
import {
  useAdminDataSession,
  useAdminEntityContext,
} from "./admin-entity-context.js";
import type { AdminCommand } from "./admin-entity-model.js";
import { normalizeAdminFilterValue } from "./admin-filter-values.js";
import { adminListSearch } from "./admin-list-search.js";
import { adminListQueriesAtom } from "./admin-list-state.js";
import { useAdminRouteBindings } from "./admin-route-bindings.js";
import { createAdminSortCommand } from "./admin-sort-command.js";
import { adminSortKey } from "./admin-sort-model.js";
import {
  invalidAdminFilterRanges,
  adminFilterDateBounds,
} from "./admin-typed-filter.js";

export { adminListSearch, readAdminListSearch } from "./admin-list-search.js";

export { AdminSelectionBar } from "./admin-selection-bar.js";
export { AdminCollectionSorting } from "./admin-collection-sorting.js";

const queryIdentity = (query: AdminListQuery) =>
  JSON.stringify([
    query.page,
    query.pageSize,
    adminSortKey(query.sort),
    Object.entries(query.filters).toSorted(([first], [second]) =>
      first.localeCompare(second)
    ),
  ]);

/** Query controls and parameterized palette commands share one validated execution path. */
export const useAdminListControls = () => {
  const { t } = useTranslation("beznyAdmin");
  const context = useAdminEntityContext();
  const session = useAdminDataSession();
  const store = useStore();
  const router = useRouter();
  const bindings = useAdminRouteBindings();
  const { entity, query } = context;
  const active = entity !== null && context.view === "list";
  const total = context.data?.status === "ready" ? context.data.total : null;
  const pageCount =
    total === null ? null : Math.max(1, Math.ceil(total / query.pageSize));
  const entityKey = entity?.key;
  const requestKey = context.request
    ? adminDataRequestKey(context.request)
    : null;
  const currentQueryKey = queryIdentity(query);
  const referenceScope = useMemo(
    () => ({
      isCurrent: () => {
        const snapshot = store.get(session.snapshotAtom);
        const storedQueries = store.get(adminListQueriesAtom);
        const current =
          entityKey && Object.hasOwn(storedQueries, entityKey)
            ? storedQueries[entityKey]
            : undefined;
        return Boolean(
          active &&
          entityKey &&
          requestKey &&
          snapshot.entity === entityKey &&
          snapshot.key === requestKey &&
          snapshot.status !== "disposed" &&
          snapshot.status !== "idle" &&
          (!current || queryIdentity(current) === currentQueryKey)
        );
      },
      locale: query.locale,
      subscribe: (notify: () => void) => {
        const snapshot = store.sub(session.snapshotAtom, notify);
        const queries = store.sub(adminListQueriesAtom, notify);
        return () => {
          snapshot();
          queries();
        };
      },
    }),
    [
      active,
      entityKey,
      requestKey,
      currentQueryKey,
      query.locale,
      session,
      store,
    ]
  );
  const update = (next: AdminListQuery) => {
    if (!entity || !referenceScope.isCurrent()) {
      return;
    }
    return router.navigate({
      params: { entity: entity.key },
      resetScroll: false,
      search: adminListSearch(next, entity, router.state.location.search),
      to: bindings.list.path,
    });
  };
  const setPage = (value: string) => {
    const page = Number(value);
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      (pageCount !== null && page > pageCount)
    ) {
      throw new Error("Invalid page number.");
    }
    return update({ ...query, page });
  };
  const filterCommands: AdminCommand[] = active
    ? (entity.filters ?? []).map((filter) => {
        const value = Object.hasOwn(query.filters, filter.key)
          ? (query.filters[filter.key] ?? "")
          : "";
        const execute = (nextValue: string) => {
          const normalized = normalizeAdminFilterValue(filter, nextValue);
          if (normalized === null) {
            throw new Error("Invalid filter value.");
          }
          const filters = Object.fromEntries(
            Object.entries(query.filters).filter(([key]) => key !== filter.key)
          );
          if (normalized) {
            filters[filter.key] = normalized;
          }
          if (invalidAdminFilterRanges(entity.filters ?? [], filters).length) {
            throw new Error("Invalid filter range.");
          }
          return update({ ...query, filters, page: 1 });
        };
        return {
          execute: () => execute(value),
          id: `${entity.key}.filter.${filter.key}`,
          input: {
            allowEmpty: true,
            execute,
            label: filter.label,
            ...(filter.multiple
              ? { multiple: true }
              : { maxLength: filter.maxLength ?? 200 }),
            ...(filter.type ? { type: filter.type } : {}),
            ...(filter.type === "number"
              ? {
                  max: filter.max ?? Number.MAX_VALUE,
                  min: filter.min ?? -Number.MAX_VALUE,
                  step: filter.step ?? "any",
                }
              : {}),
            ...(filter.type === "date"
              ? adminFilterDateBounds(
                  filter,
                  entity.filters ?? [],
                  query.filters
                )
              : {}),
            validate: (candidate) => {
              const normalized = normalizeAdminFilterValue(filter, candidate);
              return (
                normalized !== null &&
                invalidAdminFilterRanges(entity.filters ?? [], {
                  ...query.filters,
                  [filter.key]: normalized,
                }).length === 0
              );
            },
            ...(filter.options ? { options: filter.options } : {}),
            ...(filter.reference
              ? {
                  reference: {
                    scope: referenceScope,
                    source: filter.reference,
                  },
                }
              : {}),
            value,
          },
          label: t("filter", { label: filter.label }),
        };
      })
    : [];
  const sortCommand = createAdminSortCommand(
    active ? entity : null,
    query,
    t,
    update
  );
  const paginationCommands: AdminCommand[] = [];
  if (active) {
    if (query.page > 1) {
      paginationCommands.push({
        execute: () => setPage(String(query.page - 1)),
        id: `${entity.key}.page.previous`,
        label: t("previous"),
      });
    }
    if (pageCount !== null && query.page < pageCount) {
      paginationCommands.push({
        execute: () => setPage(String(query.page + 1)),
        id: `${entity.key}.page.next`,
        label: t("next"),
      });
    }
    paginationCommands.push({
      execute: () => setPage(String(query.page)),
      id: `${entity.key}.page.go`,
      input: {
        execute: setPage,
        label: t("pageNumber"),
        ...(pageCount === null ? {} : { max: pageCount }),
        min: 1,
        type: "number",
        value: String(query.page),
      },
      label: t("go"),
    });
    const sizes = [
      ...new Set([entity.pageSize ?? 25, query.pageSize, 10, 25, 50, 100]),
    ].filter((size) => size <= session.policy.maxPageSize);
    paginationCommands.push({
      execute: () => update({ ...query, page: 1 }),
      id: `${entity.key}.page.size`,
      input: {
        execute: (value) => {
          const pageSize = Number(value);
          if (!sizes.includes(pageSize)) {
            throw new Error("Invalid page size.");
          }
          return update({ ...query, page: 1, pageSize });
        },
        label: t("recordsPerPage"),
        options: sizes.map((size) => ({
          label: String(size),
          value: String(size),
        })),
        value: String(query.pageSize),
      },
      label: t("pageSize"),
    });
  }
  const clear: AdminCommand | null =
    active && Object.keys(query.filters).length > 0
      ? {
          execute: () => update({ ...query, filters: {}, page: 1 }),
          id: `${entity.key}.filters.clear`,
          label: t("clearFilters"),
        }
      : null;
  return {
    clear,
    filterCommands,
    pageCount,
    paginationCommands,
    query,
    sortCommand,
    total,
  };
};

export {
  AdminCollectionFilters,
  AdminCollectionPagination,
} from "./admin-collection-controls.js";
