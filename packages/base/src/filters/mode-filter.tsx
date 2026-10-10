import { useId, useState } from "react";

import { FieldLabel } from "../fields/field-label.js";
import { CheckboxInput } from "../inputs/checkbox-input.js";
import { RadioGroupInput, RadioInput } from "../inputs/radio-input.js";
import { TextInput } from "../inputs/text-input.js";
import { FilterPanel } from "./filter-panel.js";
import type { FilterPanelProps } from "./filter-panel.js";

import styles from "./filter.module.scss";

export interface FilterOption<TValue extends string = string> {
  value: TValue;
  label: string;
  disabled?: boolean;
}
export interface ModeFilterProps<TValue extends string = string> {
  label: string;
  value: TValue | TValue[] | null;
  options: readonly FilterOption<TValue>[];
  onChange: (value: TValue | TValue[] | null) => void;
  multiple?: boolean;
  allowAll?: boolean;
  autoOpen?: boolean;
  container?: FilterPanelProps["container"];
  searchLabel?: string;
  allLabel?: string;
  emptyLabel?: string;
  summarize?: (label: string, selectedLabels: readonly string[]) => string;
}
const selectedFilterValues = <TValue extends string>(
  value: TValue | TValue[] | null
): TValue[] => {
  if (value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};
const ModeFilterEditor = <TValue extends string>({
  label,
  value,
  options,
  onChange,
  multiple = false,
  allowAll = false,
  searchLabel = "Filter values",
  allLabel = "All",
  emptyLabel = "No matching values",
  close,
}: ModeFilterProps<TValue> & { close: () => void }) => {
  const [query, setQuery] = useState("");
  const id = useId();
  const selectedValues = selectedFilterValues(value);
  const selectedSet = new Set(selectedValues);
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase())
  );
  const choices = (
    <>
      {!multiple || allowAll ? (
        <div className={styles.option}>
          {multiple ? (
            <CheckboxInput
              id={`${id}-all`}
              checked={selectedValues.length === 0}
              onCheckedChange={() => onChange(null)}
            />
          ) : (
            <RadioInput id={`${id}-all`} value="" />
          )}
          <FieldLabel htmlFor={`${id}-all`}>{allLabel}</FieldLabel>
        </div>
      ) : null}
      {filteredOptions.map((option) => (
        <div className={styles.option} key={option.value}>
          {multiple ? (
            <CheckboxInput
              id={`${id}-${option.value}`}
              checked={selectedSet.has(option.value)}
              disabled={option.disabled ?? false}
              onCheckedChange={(checked) =>
                onChange(
                  checked
                    ? [...selectedValues, option.value]
                    : selectedValues.filter(
                        (selected) => selected !== option.value
                      )
                )
              }
            />
          ) : (
            <RadioInput
              id={`${id}-${option.value}`}
              value={option.value}
              disabled={option.disabled ?? false}
            />
          )}
          <FieldLabel htmlFor={`${id}-${option.value}`}>
            {option.label}
          </FieldLabel>
        </div>
      ))}
      {filteredOptions.length === 0 ? <output>{emptyLabel}</output> : null}
    </>
  );
  return (
    <>
      <TextInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label={searchLabel}
        placeholder={searchLabel}
      />
      {multiple ? (
        <fieldset aria-label={label} className={styles.options}>
          {choices}
        </fieldset>
      ) : (
        <RadioGroupInput
          aria-label={label}
          value={typeof value === "string" ? value : ""}
          onValueChange={(next) => {
            onChange(
              options.find((option) => option.value === next)?.value ?? null
            );
            close();
          }}
        >
          {choices}
        </RadioGroupInput>
      )}
    </>
  );
};
const defaultSummary = (label: string, selectedLabels: readonly string[]) =>
  `${label}: ${selectedLabels.length > 0 ? selectedLabels.join(", ") : "All"}`;
export const ModeFilter = <TValue extends string = string>({
  summarize = defaultSummary,
  ...props
}: ModeFilterProps<TValue>) => {
  const selectedValues = selectedFilterValues(props.value);
  const selectedSet = new Set(selectedValues);
  const selectedLabels: string[] = [];
  for (const option of props.options) {
    if (selectedSet.has(option.value)) {
      selectedLabels.push(option.label);
    }
  }
  return (
    <FilterPanel
      label={summarize(props.label, selectedLabels)}
      selected={selectedValues.length > 0}
      {...(props.autoOpen === undefined ? {} : { autoOpen: props.autoOpen })}
      {...(props.container ? { container: props.container } : {})}
    >
      {(close) => <ModeFilterEditor {...props} close={close} />}
    </FilterPanel>
  );
};
