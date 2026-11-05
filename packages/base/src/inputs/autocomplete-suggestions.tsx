import { useEffect, useRef } from "react";

import type {
  AutocompleteInputProps,
  AutocompleteLabels,
} from "./autocomplete-input.js";

import styles from "./autocomplete-input.module.scss";

type SuggestionsProps<T> = Pick<
  AutocompleteInputProps<T>,
  "options" | "getOptionKey" | "getOptionLabel"
> & {
  getOptionDisabled: (option: T) => boolean;
  getOptionSublabel: AutocompleteInputProps<T>["getOptionSublabel"];
  renderOption: AutocompleteInputProps<T>["renderOption"];
  activeId: string | undefined;
  selectedKey: string | null;
  listId: string;
  errorId: string;
  error: string | undefined;
  loading: boolean;
  labels: AutocompleteLabels;
  onActiveKeyChange: (key: string) => void;
  onCommit: (option: T) => void;
};

export const AutocompleteSuggestions = <T,>({
  options,
  getOptionKey,
  getOptionLabel,
  getOptionDisabled,
  getOptionSublabel,
  renderOption,
  activeId,
  selectedKey,
  listId,
  errorId,
  error,
  loading,
  labels,
  onActiveKeyChange,
  onCommit,
}: SuggestionsProps<T>) => {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!activeId) {
      return;
    }
    list.current
      ?.querySelector<HTMLElement>(`[id="${activeId}"]`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [activeId]);
  return (
    <>
      {/* A native select/datalist cannot expose these portaled, custom-rendered suggestions to an editable ARIA combobox. */}
      <div
        id={listId}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- APG editable combobox popup; native select/datalist has a different interaction model.
        role="listbox"
        aria-label={labels.options}
        aria-busy={loading}
        className={styles.list}
        ref={list}
      >
        {options.map((option) => {
          const key = getOptionKey(option);
          const optionId = `${listId}-${encodeURIComponent(key)}`;
          const active = optionId === activeId;
          const selected = key === selectedKey;
          const sublabel = getOptionSublabel?.(option);
          return (
            <button
              key={key}
              id={optionId}
              type="button"
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Custom listbox option retains native activation; native option requires a native select.
              role="option"
              tabIndex={-1}
              aria-selected={active}
              disabled={getOptionDisabled(option)}
              className={styles.option}
              data-active={active || undefined}
              onMouseDown={(event) => event.preventDefault()}
              onPointerMove={() => {
                if (!getOptionDisabled(option)) {
                  onActiveKeyChange(key);
                }
              }}
              onClick={() => onCommit(option)}
            >
              {renderOption ? (
                renderOption(option, { active, selected })
              ) : (
                <>
                  <span>{getOptionLabel(option)}</span>{" "}
                  {sublabel ? (
                    <span className={styles.sublabel}>{sublabel}</span>
                  ) : null}
                </>
              )}
            </button>
          );
        })}
      </div>
      {loading ? <output>{labels.loading}</output> : null}
      {error ? (
        <div id={errorId} role="alert">
          {error}
        </div>
      ) : null}
      {!loading && !error && options.length === 0 ? (
        <output>{labels.empty}</output>
      ) : null}
    </>
  );
};
