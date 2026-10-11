import { useStore } from "jotai";
import { useTranslation } from "react-i18next";

import type { AdminListQuery } from "./admin-data-adapter.js";
import { adminDataRequestKey } from "./admin-data-session.js";
import {
  useAdminDataSession,
  useAdminEntityContext,
} from "./admin-entity-context.js";
import type { AdminCommand } from "./admin-entity-model.js";
import { adminListQueriesAtom } from "./admin-list-state.js";

const queryIdentity = (query: AdminListQuery) =>
  JSON.stringify([
    query.page,
    query.pageSize,
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
  const { entity, query } = context;
  const active = entity !== null && context.view === "list";
  const total = context.data?.status === "ready" ? context.data.total : null;
  const pageCount =
    total === null ? null : Math.max(1, Math.ceil(total / query.pageSize));
  const update = (next: AdminListQuery) => {
    const snapshot = store.get(session.snapshotAtom);
    const storedQueries = store.get(adminListQueriesAtom);
    const current =
      entity && Object.hasOwn(storedQueries, entity.key)
        ? storedQueries[entity.key]
        : undefined;
    if (current && queryIdentity(current) !== queryIdentity(query)) {
      return;
    }
    if (
      !active ||
      !entity ||
      snapshot.entity !== entity.key ||
      !context.request ||
      snapshot.key !== adminDataRequestKey(context.request) ||
      snapshot.status === "disposed"
    ) {
      return;
    }
    store.set(adminListQueriesAtom, (queries) => ({
      ...queries,
      [entity.key]: next,
    }));
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
    update({ ...query, page });
  };
  const filterCommands: AdminCommand[] = active
    ? (entity.filters ?? []).map((filter) => {
        const value = Object.hasOwn(query.filters, filter.key)
          ? (query.filters[filter.key] ?? "")
          : "";
        const execute = (nextValue: string) => {
          const normalized = nextValue.trim();
          if (
            normalized.length > 200 ||
            (normalized &&
              filter.options &&
              !filter.options.some((option) => option.value === normalized))
          ) {
            throw new Error("Invalid filter value.");
          }
          const filters = Object.fromEntries(
            Object.entries(query.filters).filter(([key]) => key !== filter.key)
          );
          if (normalized) {
            filters[filter.key] = normalized;
          }
          update({ ...query, filters, page: 1 });
        };
        return {
          execute: () => execute(value),
          id: `${entity.key}.filter.${filter.key}`,
          input: {
            allowEmpty: true,
            execute,
            label: filter.label,
            maxLength: 200,
            ...(filter.options ? { options: filter.options } : {}),
            value,
          },
          label: t("filter", { label: filter.label }),
        };
      })
    : [];
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
    const sizes = [...new Set([entity.pageSize ?? 25, 10, 25, 50, 100])].filter(
      (size) => size <= session.policy.maxPageSize
    );
    paginationCommands.push({
      execute: () => update({ ...query, page: 1 }),
      id: `${entity.key}.page.size`,
      input: {
        execute: (value) => {
          const pageSize = Number(value);
          if (!sizes.includes(pageSize)) {
            throw new Error("Invalid page size.");
          }
          update({ ...query, page: 1, pageSize });
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
  return { clear, filterCommands, pageCount, paginationCommands, query, total };
};
