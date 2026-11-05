import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { useRef } from "react";

import { Button } from "../controls/button.js";
import { AutocompleteInput } from "./autocomplete-input.js";
import type { AutocompleteInputProps } from "./autocomplete-input.js";

import styles from "./multi-item-picker.module.scss";

export type MultiItemPickerProps<T> = Omit<
  AutocompleteInputProps<T>,
  "value" | "onValueChange"
> & {
  value: readonly T[];
  onValueChange: (value: T[]) => void;
  maxItems?: number;
  selectionLabel?: string;
  removeLabel?: (label: string) => string;
};
const defaultRemoveLabel = (label: string) => `Remove ${label}`;

export const MultiItemPicker = <T,>({
  value,
  onValueChange,
  options,
  getOptionKey,
  getOptionLabel,
  disabled = false,
  readOnly = false,
  maxItems,
  selectionLabel = "Selected items",
  removeLabel = defaultRemoveLabel,
  className,
  ref,
  ...props
}: MultiItemPickerProps<T>) => {
  const input = useRef<HTMLInputElement>(null);
  const group = useRef<HTMLFieldSetElement>(null);
  const composedRef = useComposedRefs(input, ref);
  const selectedKeys = new Set(value.map(getOptionKey));
  const full = maxItems !== undefined && value.length >= maxItems;
  const unavailable = disabled || readOnly;
  const visibleOptions = options.filter(
    (option) => !selectedKeys.has(getOptionKey(option))
  );
  const add = (option: T | null) => {
    if (
      option === null ||
      unavailable ||
      full ||
      selectedKeys.has(getOptionKey(option))
    ) {
      return;
    }
    onValueChange([...value, option]);
    if (maxItems !== undefined && value.length + 1 >= maxItems) {
      group.current?.focus();
    }
  };
  const remove = (key: string) => {
    if (unavailable) {
      return;
    }
    onValueChange(value.filter((option) => getOptionKey(option) !== key));
    if (input.current && !input.current.disabled) {
      input.current.focus();
    } else {
      group.current?.focus();
    }
  };
  return (
    <fieldset
      className={[styles.picker, className].filter(Boolean).join(" ")}
      aria-label={selectionLabel}
      dir={props.dir}
      tabIndex={-1}
      ref={group}
    >
      <AutocompleteInput
        {...props}
        ref={composedRef}
        value={null}
        onValueChange={add}
        options={visibleOptions}
        getOptionKey={getOptionKey}
        getOptionLabel={getOptionLabel}
        disabled={disabled || full}
        readOnly={readOnly}
      />
      {value.length ? (
        <div className={styles.selections}>
          {value.map((option) => (
            <span className={styles.selection} key={getOptionKey(option)}>
              <span>{getOptionLabel(option)}</span>
              <Button
                variant="secondary"
                size="small"
                disabled={unavailable}
                aria-label={removeLabel(getOptionLabel(option))}
                onClick={() => remove(getOptionKey(option))}
              >
                ×
              </Button>
            </span>
          ))}
        </div>
      ) : null}
    </fieldset>
  );
};
