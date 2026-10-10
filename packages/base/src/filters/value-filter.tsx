import { useState } from "react";

import { Button } from "../controls/button.js";
import { TextInput } from "../inputs/text-input.js";
import { FilterPanel } from "./filter-panel.js";
import type { FilterPanelProps } from "./filter-panel.js";

import styles from "./filter.module.scss";

export interface ValueFilterProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  inputType?: "text" | "datetime-local";
  summarize?: (label: string, value: string | null) => string;
  autoOpen?: boolean;
  container?: FilterPanelProps["container"];
}
const ValueFilterEditor = ({
  label,
  value,
  onChange,
  placeholder = "Filter value",
  inputType = "text",
  close,
}: ValueFilterProps & { close: () => void }) => {
  const [draft, setDraft] = useState(value ?? "");
  const [previousValue, setPreviousValue] = useState(value);
  if (previousValue !== value) {
    setPreviousValue(value);
    setDraft(value ?? "");
  }
  const handleApply = () => {
    const next = draft.trim();
    onChange(next || null);
    close();
  };
  return (
    <>
      <TextInput
        aria-label={label}
        placeholder={placeholder}
        type={inputType}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleApply();
          }
        }}
      />
      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={() => {
            onChange(null);
            close();
          }}
        >
          Clear
        </Button>
        <Button onClick={handleApply}>Apply</Button>
      </div>
    </>
  );
};
const defaultSummary = (label: string, value: string | null) =>
  `${label}: ${value?.trim() || "All"}`;
export const ValueFilter = ({
  summarize = defaultSummary,
  ...props
}: ValueFilterProps) => (
  <FilterPanel
    label={summarize(props.label, props.value)}
    selected={Boolean(props.value)}
    {...(props.autoOpen === undefined ? {} : { autoOpen: props.autoOpen })}
    {...(props.container ? { container: props.container } : {})}
  >
    {(close) => <ValueFilterEditor {...props} close={close} />}
  </FilterPanel>
);
