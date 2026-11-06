import { Button } from "@bezny/base";
import { Command as CommandMenu } from "cmdk";
import { useStore } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { AdminCommand } from "./admin-entity-model.js";
import {
  adminSearchContextAtom,
  validateAdminSearchResults,
} from "./admin-remote-search.js";
import type {
  AdminSearchContext,
  AdminSearchSource,
  AdminSearchResult,
} from "./admin-remote-search.js";

import styles from "./admin-chrome.module.scss";

interface SearchState {
  context: AdminSearchContext;
  query: string;
  attempt: number;
  status: "loading" | "error" | "ready";
  items: readonly AdminSearchResult[];
}
export const AdminSearchGroup = ({
  source,
  context,
  query: rawQuery,
  select,
}: {
  source: AdminSearchSource;
  context: AdminSearchContext;
  query: string;
  select: (command: AdminCommand) => void;
}) => {
  const query = rawQuery.trim().slice(0, 200);
  const store = useStore();
  const { t } = useTranslation("beznyAdmin", { keyPrefix: "chrome" });
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<SearchState | null>(null);
  useEffect(() => {
    if (!query || context.signal.aborted) {
      return;
    }
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, context.signal]);
    const owner = { attempt, context, query };
    const timer = setTimeout(async () => {
      try {
        signal.throwIfAborted();
        const items = validateAdminSearchResults(
          await source.search({
            limit: 20,
            locale: context.locale,
            query,
            signal,
          })
        );
        if (!signal.aborted) {
          setState({ ...owner, items, status: "ready" });
        }
      } catch {
        if (!signal.aborted) {
          setState({ ...owner, items: [], status: "error" });
        }
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [context, query, source, attempt]);
  if (!query || context.signal.aborted) {
    return null;
  }
  const current =
    state?.context === context &&
    state.query === query &&
    state.attempt === attempt
      ? state
      : null;
  return (
    <CommandMenu.Group forceMount heading={source.label}>
      {(!current || current.status === "loading") && (
        <output>{t("searchLoading")}</output>
      )}
      {current?.status === "error" && (
        <div role="alert">
          {t("searchError")}{" "}
          <Button
            variant="secondary"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {t("searchRetry", { source: source.label })}
          </Button>
        </div>
      )}
      {current?.status === "ready" && current.items.length === 0 && (
        <output>{t("searchEmpty")}</output>
      )}
      {current?.status === "ready" &&
        current.items.map((result) => (
          <CommandMenu.Item
            forceMount
            key={result.id}
            value={`remote:${JSON.stringify([source.id, result.id])}`}
            className={styles.paletteItem}
            onSelect={() =>
              select({
                execute: () => {
                  if (
                    context.signal.aborted ||
                    store.get(adminSearchContextAtom) !== context ||
                    (result.isAvailable && !result.isAvailable())
                  ) {
                    return;
                  }
                  return result.execute();
                },
                id: `remote:${JSON.stringify([source.id, result.id])}`,
                label: result.label,
              })
            }
          >
            <span>{result.label}</span>
          </CommandMenu.Item>
        ))}
    </CommandMenu.Group>
  );
};
