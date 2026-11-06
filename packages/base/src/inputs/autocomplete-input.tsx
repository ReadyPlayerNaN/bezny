import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { Button } from "../controls/button.js";
import { Popover, PopoverAnchor, PopoverContent } from "../controls/popover.js";
import type { PopoverContentProps } from "../controls/popover.js";
import { AutocompleteSuggestions } from "./autocomplete-suggestions.js";
import { TextInput } from "./text-input.js";
import type { TextInputProps } from "./text-input.js";
import { useAutocompletePopup } from "./use-autocomplete-popup.js";

import styles from "./autocomplete-input.module.scss";

export interface AutocompleteLabels {
  options: string;
  loading: string;
  empty: string;
  clear: string;
}
export type AutocompleteInputProps<T> = Omit<
  TextInputProps,
  | "value"
  | "defaultValue"
  | "onChange"
  | "type"
  | "role"
  | "aria-autocomplete"
  | "aria-activedescendant"
  | "aria-controls"
  | "aria-expanded"
> & {
  value: T | null;
  onValueChange: (value: T | null) => void;
  query: string;
  onQueryChange: (query: string) => void;
  /** Reports rendered suggestion visibility, including dismissal and availability changes. */
  onOpenChange?: (open: boolean) => void;
  options: readonly T[];
  getOptionKey: (option: T) => string;
  getOptionLabel: (option: T) => string;
  getOptionSublabel?: (option: T) => string | null | undefined;
  getOptionDisabled?: (option: T) => boolean;
  renderOption?: (
    option: T,
    state: { active: boolean; selected: boolean }
  ) => ReactNode;
  loading?: boolean;
  error?: string;
  /** Request another host-owned search; keeps retry accessible outside the popup. */
  onRetry?: () => void;
  retryLabel?: string;
  minimumQueryLength?: number;
  labels?: Partial<AutocompleteLabels>;
  portalContainer?: PopoverContentProps["container"];
};
const defaults: AutocompleteLabels = {
  clear: "Clear selection",
  empty: "No matches",
  loading: "Loading suggestions",
  options: "Suggestions",
};
const defaultOptionDisabled = () => false;
const imeKeyCode = 229;
const AutocompleteRetry = ({
  error,
  loading,
  disabled,
  onRetry,
  label = "Retry",
  onActivate,
}: {
  error: string | undefined;
  loading: boolean;
  disabled: boolean;
  onRetry: (() => void) | undefined;
  label: string | undefined;
  onActivate: () => void;
}) => {
  if (!error || !onRetry) {
    return null;
  }
  return (
    <Button
      variant="secondary"
      size="small"
      disabled={disabled || loading}
      onClick={() => {
        if (disabled || loading) {
          return;
        }
        onActivate();
        onRetry();
      }}
    >
      {label}
    </Button>
  );
};

/** A controlled selection and query; remote sessions, debounce and stale-result fencing belong to the host. */
export const AutocompleteInput = <T,>({
  value,
  onValueChange,
  query,
  onQueryChange,
  onOpenChange,
  options,
  getOptionKey,
  getOptionLabel,
  getOptionSublabel,
  getOptionDisabled = defaultOptionDisabled,
  renderOption,
  loading = false,
  error,
  onRetry,
  retryLabel,
  minimumQueryLength = 1,
  labels: overrides,
  portalContainer,
  disabled = false,
  readOnly = false,
  className,
  ref,
  onFocus,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  "aria-describedby": describedBy,
  ...props
}: AutocompleteInputProps<T>) => {
  const labels = { ...defaults, ...overrides };
  const id = useId();
  const listId = `${id}-suggestions`;
  const errorId = `${id}-search-error`;
  const input = useRef<HTMLInputElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const suppressFocusOpen = useRef(false);
  const inputRef = useComposedRefs(input, ref);
  const unavailable = disabled || readOnly;
  const [open, setOpen] = useAutocompletePopup(unavailable);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const expanded =
    open && !unavailable && query.trim().length >= minimumQueryLength;
  useEffect(() => {
    // oxlint-disable-next-line react-doctor/no-pass-data-to-parent -- External request owners must observe derived visibility, including prop-driven availability/query changes without an input event.
    onOpenChange?.(expanded);
  }, [expanded, onOpenChange]);
  const enabledOptions = options.filter((option) => !getOptionDisabled(option));
  const activeOption =
    enabledOptions.find((option) => getOptionKey(option) === activeKey) ??
    enabledOptions[0];
  const activeId =
    expanded && activeOption !== undefined
      ? `${listId}-${encodeURIComponent(getOptionKey(activeOption))}`
      : undefined;
  const selectedKey = value === null ? null : getOptionKey(value);
  const inputValue =
    query === "" && value !== null ? getOptionLabel(value) : query;

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (
      restoreFocus &&
      input.current &&
      document.activeElement !== input.current
    ) {
      suppressFocusOpen.current = true;
      input.current.focus();
    }
  };
  const clear = () => {
    if (unavailable) {
      return;
    }
    const focusedBeforeChange = document.activeElement;
    onValueChange(null);
    onQueryChange("");
    close(document.activeElement === focusedBeforeChange);
  };
  const commit = (option: T) => {
    if (unavailable || getOptionDisabled(option)) {
      return;
    }
    const focusedBeforeChange = document.activeElement;
    onValueChange(option);
    onQueryChange("");
    close(document.activeElement === focusedBeforeChange);
  };
  const move = (direction: number) => {
    setOpen(true);
    if (!enabledOptions.length) {
      return;
    }
    const current =
      activeOption === undefined ? -1 : enabledOptions.indexOf(activeOption);
    let index = direction > 0 ? 0 : enabledOptions.length - 1;
    if (expanded) {
      index =
        (current + direction + enabledOptions.length) % enabledOptions.length;
    }
    const next = enabledOptions[index];
    if (next !== undefined) {
      setActiveKey(getOptionKey(next));
    }
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      unavailable ||
      composing.current ||
      event.nativeEvent.isComposing ||
      event.keyCode === imeKeyCode
    ) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (expanded && activeOption !== undefined) {
        commit(activeOption);
      } else {
        setOpen(true);
      }
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      close(false);
      return;
    }
    if (
      (event.key === "Backspace" || event.key === "Delete") &&
      query === "" &&
      value !== null
    ) {
      event.preventDefault();
      clear();
    }
    if (event.key === "Tab") {
      close(false);
    }
  };

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      dir={props.dir}
    >
      <Popover open={expanded} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className={styles.field} ref={anchor}>
            <TextInput
              {...props}
              ref={inputRef}
              value={inputValue}
              type="text"
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- TextInput renders the native input required by the APG editable combobox pattern.
              role="combobox"
              autoComplete="off"
              disabled={disabled}
              readOnly={readOnly}
              aria-autocomplete="list"
              aria-expanded={expanded}
              aria-controls={expanded ? listId : undefined}
              aria-activedescendant={activeId}
              aria-describedby={
                [describedBy, expanded && error ? errorId : undefined]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              onFocus={(event) => {
                onFocus?.(event);
                if (suppressFocusOpen.current) {
                  suppressFocusOpen.current = false;
                  return;
                }
                if (!unavailable && !event.defaultPrevented) {
                  if (value !== null && query === "") {
                    event.currentTarget.select();
                  }
                  setOpen(true);
                }
              }}
              onChange={(event) => {
                if (unavailable) {
                  return;
                }
                if (value !== null && query === "") {
                  onValueChange(null);
                }
                setActiveKey(null);
                setOpen(true);
                onQueryChange(event.target.value);
              }}
              onKeyDown={handleKeyDown}
              onCompositionStart={(event) => {
                composing.current = true;
                onCompositionStart?.(event);
              }}
              onCompositionEnd={(event) => {
                composing.current = false;
                onCompositionEnd?.(event);
              }}
            />
            <AutocompleteRetry
              error={error}
              loading={loading}
              disabled={unavailable}
              onRetry={onRetry}
              label={retryLabel}
              onActivate={() => {
                input.current?.focus();
                setOpen(true);
              }}
            />
            {value === null ? null : (
              <Button
                variant="secondary"
                size="small"
                disabled={unavailable}
                onClick={clear}
              >
                {labels.clear}
              </Button>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          container={portalContainer}
          className={styles.panel}
          role="presentation"
          align="start"
          dir={props.dir}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            const { target } = event.detail.originalEvent;
            if (target instanceof Node && anchor.current?.contains(target)) {
              event.preventDefault();
            }
          }}
          onEscapeKeyDown={(event) => {
            if (
              composing.current ||
              event.isComposing ||
              event.keyCode === imeKeyCode
            ) {
              event.preventDefault();
            }
          }}
        >
          <AutocompleteSuggestions
            options={options}
            getOptionKey={getOptionKey}
            getOptionLabel={getOptionLabel}
            getOptionDisabled={getOptionDisabled}
            getOptionSublabel={getOptionSublabel}
            renderOption={renderOption}
            activeId={activeId}
            selectedKey={selectedKey}
            listId={listId}
            errorId={errorId}
            error={error}
            loading={loading}
            labels={labels}
            onActiveKeyChange={setActiveKey}
            onCommit={commit}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
