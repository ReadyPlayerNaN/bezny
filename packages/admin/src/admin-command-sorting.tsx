import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bezny/base";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { AdminCommand } from "./admin-entity-model.js";
import { readAdminSortInput } from "./admin-sort-model.js";
import type { AdminSortRule } from "./admin-sort-model.js";

import styles from "./admin-sorting.module.scss";

/** One RHF draft editor for the standard collection and command palette. */
export const AdminCommandSorting = ({
  input,
}: {
  input: NonNullable<AdminCommand["input"]>;
}) => {
  const { field } = useController<{ value: string }>({ name: "value" });
  const { t } = useTranslation("beznyAdmin", { keyPrefix: "sorting" });
  const { sorting } = input;
  if (!sorting) {
    return null;
  }
  const rules = readAdminSortInput(field.value, sorting) ?? [];
  const selected = new Set(rules.map(({ key }) => key));
  const next = sorting.fields.find(({ key }) => !selected.has(key));
  const change = (value: readonly AdminSortRule[]) =>
    field.onChange(JSON.stringify(value));
  const move = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= rules.length) {
      return;
    }
    const reordered = [...rules];
    const [rule] = reordered.splice(index, 1);
    if (rule) {
      reordered.splice(target, 0, rule);
      change(reordered);
    }
  };
  return (
    <fieldset className={styles.editor}>
      <legend>{input.label}</legend>
      {rules.length === 0 && <p>{t("none")}</p>}
      <ol>
        {rules.map((rule, index) => {
          const label =
            sorting.fields.find(({ key }) => key === rule.key)?.label ??
            rule.key;
          return (
            <li key={rule.key}>
              <span>{t("priority", { priority: index + 1 })}</span>
              <Select
                value={rule.key}
                onValueChange={(key) => {
                  if (
                    key &&
                    sorting.fields.some((candidate) => candidate.key === key) &&
                    (key === rule.key || !selected.has(key))
                  ) {
                    change(
                      rules.map((current, position) =>
                        position === index ? { ...current, key } : current
                      )
                    );
                  }
                }}
              >
                <SelectTrigger
                  ref={index === 0 ? field.ref : undefined}
                  onBlur={() => field.onBlur()}
                  aria-label={t("field", { priority: index + 1 })}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sorting.fields.flatMap((option) =>
                    option.key === rule.key || !selected.has(option.key)
                      ? [
                          <SelectItem key={option.key} value={option.key}>
                            {option.label}
                          </SelectItem>,
                        ]
                      : []
                  )}
                </SelectContent>
              </Select>
              <Select
                value={rule.direction}
                onValueChange={(direction) => {
                  if (direction === "asc" || direction === "desc") {
                    change(
                      rules.map((current, position) =>
                        position === index ? { ...current, direction } : current
                      )
                    );
                  }
                }}
              >
                <SelectTrigger
                  onBlur={() => field.onBlur()}
                  aria-label={t("direction", { label })}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">{t("asc")}</SelectItem>
                  <SelectItem value="desc">{t("desc")}</SelectItem>
                </SelectContent>
              </Select>
              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={index === 0}
                  aria-label={t("upLabel", { label })}
                  onClick={() => move(index, -1)}
                >
                  {t("up")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={index === rules.length - 1}
                  aria-label={t("downLabel", { label })}
                  onClick={() => move(index, 1)}
                >
                  {t("down")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  aria-label={t("remove", { label })}
                  onClick={() =>
                    change(rules.filter((current) => current.key !== rule.key))
                  }
                >
                  {t("removeButton")}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          ref={rules.length === 0 ? field.ref : undefined}
          onBlur={() => field.onBlur()}
          disabled={!next}
          onClick={() => {
            if (next) {
              change([...rules, { direction: "asc", key: next.key }]);
            }
          }}
        >
          {t("add")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => change([])}>
          {t("clear")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => change(sorting.default ?? [])}
        >
          {t("reset")}
        </Button>
      </div>
    </fieldset>
  );
};
