import {
  Button,
  ChoiceFilter,
  ValueFilter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@bezny/base";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAdminEntityContext } from "./admin-entity-context.js";
import type { AdminCommand } from "./admin-entity-model.js";
import { useAdminListControls } from "./admin-list-controls.js";

import styles from "./admin-collection.module.scss";

const useCollectionExecution = () => {
  const [failed, setFailed] = useState(false);
  const execute = async (command: AdminCommand, value?: string) => {
    setFailed(false);
    try {
      await (value !== undefined && command.input
        ? command.input.execute(value)
        : command.execute());
    } catch {
      setFailed(true);
    }
  };
  return { execute, failed };
};
export const AdminCollectionFilters = () => {
  const { filterCommands, clear } = useAdminListControls();
  const { t } = useTranslation("beznyAdmin");
  const { execute, failed } = useCollectionExecution();
  return (
    <section aria-label={t("defaults.controls")}>
      <div className={styles.filters}>
        {filterCommands.map((command) => {
          const { input } = command;
          if (!input) {
            return null;
          }
          return input.options ? (
            <ChoiceFilter
              key={command.id}
              label={input.label}
              value={input.value || null}
              options={input.options}
              allLabel={t("defaults.all")}
              searchLabel={t("defaults.filterValues")}
              emptyLabel={t("defaults.noValues")}
              summarize={(label, labels) =>
                `${label}: ${labels.length ? labels.join(", ") : t("defaults.all")}`
              }
              onChange={(value) => {
                void execute(command, value ?? "");
              }}
            />
          ) : (
            <ValueFilter
              key={command.id}
              label={input.label}
              value={input.value || null}
              maxLength={input.maxLength}
              applyLabel={t("defaults.apply")}
              clearLabel={t("defaults.clear")}
              placeholder={t("defaults.filterValue")}
              summarize={(label, value) =>
                `${label}: ${value || t("defaults.all")}`
              }
              onChange={(value) => {
                void execute(command, value ?? "");
              }}
            />
          );
        })}
        {clear && (
          <Button
            variant="secondary"
            onClick={() => {
              void execute(clear);
            }}
          >
            {clear.label}
          </Button>
        )}
      </div>
      {failed && <p role="alert">{t("error")}</p>}
    </section>
  );
};

/** A bounded page window with first/last anchors, not an input form. */
const visiblePageNumbers = (page: number, pageCount: number | null) => {
  if (pageCount === null) {
    return [page];
  }
  const pages = new Set([1, pageCount]);
  for (const candidate of [page - 1, page, page + 1]) {
    if (candidate >= 1 && candidate <= pageCount) {
      pages.add(candidate);
    }
  }
  return [...pages].toSorted((first, second) => first - second);
};
export const AdminCollectionPagination = () => {
  const { paginationCommands, query, pageCount, total } =
    useAdminListControls();
  const { entity } = useAdminEntityContext();
  const { t, i18n } = useTranslation("beznyAdmin");
  const { execute, failed } = useCollectionExecution();
  const pageSizeId = useId();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(language, {
        numberingSystem: language === "ar" ? "arab" : undefined,
      }),
    [language]
  );
  const previous = paginationCommands.find(
    (command) => command.id === `${entity?.key}.page.previous`
  );
  const next = paginationCommands.find(
    (command) => command.id === `${entity?.key}.page.next`
  );
  const go = paginationCommands.find(
    (command) => command.id === `${entity?.key}.page.go`
  );
  const size = paginationCommands.find(
    (command) => command.id === `${entity?.key}.page.size`
  );
  const pages = visiblePageNumbers(query.page, pageCount);
  return (
    <nav aria-label={t("defaults.pagination")} className={styles.pagination}>
      <output>
        {t("defaults.pageSummary", {
          page: formatter.format(query.page),
          pages: pageCount === null ? "…" : formatter.format(pageCount),
          total: total === null ? "…" : formatter.format(total),
        })}
      </output>
      <div className={styles.pageNavigation}>
        <Button
          variant="secondary"
          disabled={!previous}
          onClick={() => {
            if (previous) {
              void execute(previous);
            }
          }}
        >
          {t("previous")}
        </Button>
        {pages.map((page, index) => (
          <span key={page}>
            {index > 0 && page > (pages[index - 1] ?? 0) + 1 && (
              <span aria-hidden="true">… </span>
            )}
            <Button
              variant="secondary"
              aria-current={page === query.page ? "page" : undefined}
              aria-label={t("defaults.page", { page: formatter.format(page) })}
              disabled={!go || page === query.page || pageCount === null}
              onClick={() => {
                if (go) {
                  void execute(go, String(page));
                }
              }}
            >
              {formatter.format(page)}
            </Button>
          </span>
        ))}
        <Button
          variant="secondary"
          disabled={!next}
          onClick={() => {
            if (next) {
              void execute(next);
            }
          }}
        >
          {t("next")}
        </Button>
      </div>
      {size?.input?.options && (
        <div className={styles.pageSize}>
          <label htmlFor={pageSizeId}>{size.input.label}</label>
          <Select
            value={String(query.pageSize)}
            onValueChange={(value) => {
              void execute(size, value);
            }}
          >
            <SelectTrigger id={pageSizeId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {size.input.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {formatter.format(Number(option.value))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {failed && <p role="alert">{t("error")}</p>}
    </nav>
  );
};
