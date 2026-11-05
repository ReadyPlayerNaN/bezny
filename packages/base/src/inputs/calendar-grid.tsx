import { useEffect, useRef, useState } from "react";

import type { CalendarDate } from "./calendar-value.js";

import styles from "./calendar-input.module.scss";

export interface CalendarCell {
  key: string;
  date: CalendarDate;
  label: string;
  accessibleLabel: string;
  disabled: boolean;
  selected: boolean;
  current: boolean;
  outside: boolean;
}
export interface CalendarWeekday {
  key: string;
  short: string;
  long: string;
}
interface CalendarGridProps {
  label: string;
  cells: CalendarCell[];
  columns: number;
  weekdays: CalendarWeekday[] | undefined;
  focusKey: string | null;
  entryKey: string;
  disabled: boolean;
  dir: "ltr" | "rtl";
  onSelect: (cell: CalendarCell) => void;
  onNavigate: (cell: CalendarCell, key: string, shift: boolean) => void;
}
const navigationKeys = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);
/** Radix has no public calendar/grid primitive; its roving-focus package explicitly disclaims public use. Popover owns overlay behavior. */
export const CalendarGrid = ({
  label,
  cells,
  columns,
  weekdays,
  focusKey,
  entryKey,
  disabled,
  dir,
  onSelect,
  onNavigate,
}: CalendarGridProps) => {
  const table = useRef<HTMLTableElement>(null);
  const [tabStop, setTabStop] = useState({ entry: entryKey, key: entryKey });
  if (tabStop.entry !== entryKey) {
    setTabStop({ entry: entryKey, key: entryKey });
  }
  const available = cells.filter((cell) => !disabled && !cell.disabled);
  const active =
    available.find((cell) => cell.key === tabStop.key) ?? available[0];
  useEffect(() => {
    if (!focusKey) {
      return;
    }
    const target = table.current?.querySelector<HTMLButtonElement>(
      `[data-calendar-key="${focusKey}"]:not(:disabled)`
    );
    if (target) {
      target.focus();
    } else {
      table.current?.focus();
    }
  }, [focusKey]);
  const rows = Array.from(
    { length: Math.ceil(cells.length / columns) },
    (_, index) => cells.slice(index * columns, (index + 1) * columns)
  );
  return (
    <table
      ref={table}
      dir={dir}
      tabIndex={-1}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- APG calendar uses native table structure with grid semantics and one tabbable date button.
      role="grid"
      aria-label={label}
      className={styles.grid}
    >
      {weekdays ? (
        <thead>
          <tr>
            {weekdays.map((day) => (
              <th key={day.key} scope="col" aria-label={day.long}>
                {day.short}
              </th>
            ))}
          </tr>
        </thead>
      ) : null}
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]?.key}>
            {row.map((cell) => (
              <td key={cell.key} aria-selected={cell.selected || undefined}>
                <button
                  type="button"
                  className={styles.cell}
                  data-calendar-key={cell.key}
                  data-selected={cell.selected || undefined}
                  data-outside={cell.outside || undefined}
                  aria-label={cell.accessibleLabel}
                  aria-current={cell.current ? "date" : undefined}
                  disabled={disabled || cell.disabled}
                  tabIndex={cell.key === active?.key ? 0 : -1}
                  onFocus={() => setTabStop({ entry: entryKey, key: cell.key })}
                  onClick={() => {
                    if (!disabled && !cell.disabled) {
                      onSelect(cell);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.defaultPrevented ||
                      event.altKey ||
                      event.ctrlKey ||
                      event.metaKey ||
                      !navigationKeys.has(event.key)
                    ) {
                      return;
                    }
                    event.preventDefault();
                    if (!disabled && !cell.disabled) {
                      onNavigate(cell, event.key, event.shiftKey);
                    }
                  }}
                >
                  {cell.label}
                </button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
