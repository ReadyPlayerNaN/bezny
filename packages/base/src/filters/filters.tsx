import { useState } from "react";
import type { ReactNode } from "react";

import { Button } from "../controls/button.js";
import { TextInput } from "../inputs/text-input.js";
import { FilterPanel } from "./filter-panel.js";
import type { FilterPanelProps } from "./filter-panel.js";

import styles from "./filter.module.scss";

export interface FilterItem {
  key: string;
  label: string;
  active: boolean;
  alwaysVisible?: boolean;
  render: (props: { autoOpen: boolean }) => ReactNode;
}
export interface FiltersProps {
  items: readonly FilterItem[];
  className?: string;
  onItemOpen?: (key: string) => void;
  container?: FilterPanelProps["container"];
}
const FilterPicker = ({
  items,
  onSelect,
  close,
}: {
  items: readonly FilterItem[];
  onSelect: (key: string) => void;
  close: () => void;
}) => {
  const [query, setQuery] = useState("");
  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase())
  );
  return (
    <>
      <TextInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Filter filters"
        placeholder="Filter filters"
      />
      <div className={styles.options}>
        {filtered.map((item) => (
          <Button
            key={item.key}
            variant="secondary"
            onClick={() => {
              onSelect(item.key);
              close();
            }}
          >
            {item.label}
          </Button>
        ))}
        {filtered.length === 0 ? <output>No matching filters</output> : null}
      </div>
    </>
  );
};
export const Filters = ({
  items,
  className,
  onItemOpen,
  container,
}: FiltersProps) => {
  const [stagedKey, setStagedKey] = useState<string | null>(null);
  const staged = items.find((item) => item.key === stagedKey && !item.active);
  if (stagedKey && !staged) {
    setStagedKey(null);
  }
  const visible = items.filter(
    (item) => item.alwaysVisible || item.active || item.key === staged?.key
  );
  const addable = items.filter(
    (item) => !item.alwaysVisible && !item.active && item.key !== staged?.key
  );
  return (
    <div className={[styles.list, className].filter(Boolean).join(" ")}>
      {visible.map((item) => (
        <div key={item.key}>
          {item.render({ autoOpen: item.key === staged?.key })}
        </div>
      ))}
      <FilterPanel
        label="Filter"
        selected={false}
        disabled={addable.length === 0}
        suppressReturnFocus={Boolean(staged)}
        {...(container ? { container } : {})}
      >
        {(close) => (
          <FilterPicker
            items={addable}
            close={close}
            onSelect={(key) => {
              setStagedKey(key);
              onItemOpen?.(key);
            }}
          />
        )}
      </FilterPanel>
    </div>
  );
};
