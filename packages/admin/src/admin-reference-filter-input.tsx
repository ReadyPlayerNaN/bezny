import { Button, FieldLabel, MultiItemPicker } from "@bezny/base";
import { useCallback, useId, useMemo, useSyncExternalStore } from "react";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";

import {
  adminFilterSelectionLimit,
  decodeAdminFilterSelection,
  encodeAdminFilterSelection,
} from "./admin-filter-values.js";
import { useAdminReferenceDraft } from "./admin-reference-filter-draft.js";
import {
  adminReferenceDebounceMs,
  adminReferenceQueryLimit,
  adminReferenceSearchLimit,
  validateAdminFilterReferences,
} from "./admin-reference-filter-model.js";
import type {
  AdminFilterReference,
  AdminReferenceFilterInput as ReferenceInput,
} from "./admin-reference-filter-model.js";
import { useAdminReferenceRequest } from "./admin-reference-filter-request.js";

const optionKey = (option: AdminFilterReference) => option.value;
const optionLabel = (option: AdminFilterReference) => option.label;

export const AdminReferenceFilterInput = ({
  reference: { source, scope },
  value,
  multiple = false,
  label,
  onChange,
  onBlur,
  name,
  inputRef,
}: {
  reference: ReferenceInput;
  value: string;
  multiple?: boolean;
  label: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  inputRef?: Ref<HTMLInputElement>;
}) => {
  const { t, i18n } = useTranslation("beznyAdmin", {
    keyPrefix: "referenceFilter",
  });
  const id = useId();
  const active = useSyncExternalStore(
    scope.subscribe,
    scope.isCurrent,
    scope.isCurrent
  );
  const draft = useAdminReferenceDraft(scope);
  const { query, open, composing } = draft;
  const selectedIds = useMemo(() => {
    if (multiple) {
      return decodeAdminFilterSelection(value);
    }
    return value ? [value] : [];
  }, [multiple, value]);
  const resolve = useCallback(
    async (signal: AbortSignal) =>
      validateAdminFilterReferences(
        await source.resolve(selectedIds, {
          limit: selectedIds.length,
          locale: scope.locale,
          signal,
        }),
        selectedIds.length,
        selectedIds
      ),
    [source, scope, selectedIds]
  );
  const search = useCallback(
    async (signal: AbortSignal) =>
      validateAdminFilterReferences(
        await source.search(query.trim(), {
          limit: adminReferenceSearchLimit,
          locale: scope.locale,
          signal,
        }),
        adminReferenceSearchLimit
      ),
    [source, scope, query]
  );
  const resolved = useAdminReferenceRequest({
    enabled: active && selectedIds.length > 0,
    load: resolve,
    scope,
  });
  const suggestions = useAdminReferenceRequest({
    delay: adminReferenceDebounceMs,
    enabled: active && open && !composing && query.trim().length > 0,
    load: search,
    scope,
  });
  const selected = selectedIds.map(
    (selectedId) =>
      resolved.options.find((option) => option.value === selectedId) ?? {
        label: selectedId,
        value: selectedId,
      }
  );
  const change = (options: AdminFilterReference[]) => {
    if (!scope.isCurrent()) {
      return;
    }
    const available = new Set([
      ...selectedIds,
      ...suggestions.options.map(optionKey),
    ]);
    if (options.some((option) => !available.has(option.value))) {
      return;
    }
    onChange(
      multiple
        ? encodeAdminFilterSelection(options.map(optionKey))
        : (options.at(-1)?.value ?? "")
    );
  };
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <MultiItemPicker
        id={id}
        name={name}
        ref={inputRef}
        onBlur={onBlur}
        dir={i18n.dir()}
        aria-label={label}
        value={selected}
        onValueChange={change}
        query={query}
        onQueryChange={draft.handleQueryChange}
        onOpenChange={draft.handleOpenChange}
        onCompositionStart={draft.handleCompositionStart}
        onCompositionEnd={draft.handleCompositionEnd}
        options={suggestions.options}
        getOptionKey={optionKey}
        getOptionLabel={optionLabel}
        {...(multiple ? { maxItems: adminFilterSelectionLimit } : {})}
        maxLength={adminReferenceQueryLimit}
        disabled={!active}
        loading={suggestions.pending}
        {...(suggestions.failed ? { error: t("error") } : {})}
        onRetry={() => suggestions.retry()}
        retryLabel={t("retrySearch")}
        selectionLabel={t("selected", { label })}
        removeLabel={(selectedLabel) => t("remove", { label: selectedLabel })}
        labels={{
          clear: t("clear"),
          empty: t("empty"),
          loading: t("loading"),
          options: t("options"),
        }}
      />
      {resolved.pending && <output>{t("resolving")}</output>}
      {resolved.failed && <p role="alert">{t("resolveError")}</p>}
      {resolved.failed && (
        <Button variant="secondary" onClick={() => resolved.retry()}>
          {t("retryResolve")}
        </Button>
      )}
    </div>
  );
};
