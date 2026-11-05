import { useMemo, useState } from "react";

import { Button } from "../controls/button.js";
import { CalendarGrid } from "./calendar-grid.js";
import type { CalendarCell } from "./calendar-grid.js";
import type { CalendarInputLabels } from "./calendar-input-props.js";
import {
  calendarCellKey,
  calendarPageAvailable,
  calendarPageFormats,
  calendarWeekdays,
  createCalendarCells,
  navigateCalendarCell,
} from "./calendar-pages.js";
import type { CalendarMode } from "./calendar-pages.js";
import {
  calendarDate,
  calendarYearPage,
  clampCalendarDate,
  DAYS_PER_WEEK,
  inCalendarBounds,
  shiftCalendarDate,
  YEARS_PER_PAGE,
} from "./calendar-value.js";
import type {
  CalendarBounds,
  CalendarDate,
  CalendarKind,
} from "./calendar-value.js";

import styles from "./calendar-input.module.scss";

interface CalendarPanelProps {
  kind: CalendarKind;
  selected: CalendarDate | null;
  today: CalendarDate;
  bounds: CalendarBounds;
  locale: string;
  weekStartsOn: number;
  labels: CalendarInputLabels;
  disabled: boolean;
  dir: "ltr" | "rtl";
  onPick: (date: CalendarDate) => void;
  onClear: () => void;
}
interface CalendarPanelState {
  view: CalendarDate;
  yearPage: number;
  mode: CalendarMode;
  focusKey: string | null;
}
export const CalendarPanel = ({
  kind,
  selected,
  today,
  bounds,
  locale,
  weekStartsOn,
  labels,
  disabled,
  dir,
  onPick,
  onClear,
}: CalendarPanelProps) => {
  const [state, setState] = useState<CalendarPanelState>(() => {
    const view = clampCalendarDate(selected ?? today, bounds);
    return {
      focusKey: calendarCellKey(view, kind, "values"),
      mode: "values",
      view,
      yearPage: calendarYearPage(view.year),
    };
  });
  const { view, yearPage, mode, focusKey } = state;
  const formats = useMemo(
    () => calendarPageFormats(kind, locale),
    [kind, locale]
  );
  const weekdays = useMemo(
    () => calendarWeekdays(locale, weekStartsOn),
    [locale, weekStartsOn]
  );
  const page = {
    bounds,
    formats,
    kind,
    mode,
    selected,
    today,
    view,
    weekStartsOn,
    yearPage,
  };
  const cells = createCalendarCells(page);
  const numberFormat = formats.numbers;
  let heading = numberFormat.format(view.year);
  if (kind === "date") {
    heading = formats.heading.format(calendarDate(view));
  }
  if (mode === "years") {
    heading = `${numberFormat.format(yearPage)}–${numberFormat.format(yearPage + YEARS_PER_PAGE - 1)}`;
  }
  const step = (delta: number) => {
    if (disabled) {
      return;
    }
    const unit = kind === "date" ? "month" : "year";
    if (mode === "years") {
      const nextPage = yearPage + delta * YEARS_PER_PAGE;
      const canContinue = calendarPageAvailable(
        view,
        kind,
        mode,
        nextPage + delta * YEARS_PER_PAGE,
        bounds
      );
      const entryYear = Math.min(
        Math.max(view.year, nextPage, bounds.min.year),
        nextPage + YEARS_PER_PAGE - 1,
        bounds.max.year
      );
      setState({
        ...state,
        focusKey: canContinue
          ? null
          : calendarCellKey({ ...view, year: entryYear }, kind, mode),
        yearPage: nextPage,
      });
    } else {
      const target = clampCalendarDate(
        shiftCalendarDate(view, delta, unit),
        bounds
      );
      const canContinue = calendarPageAvailable(
        shiftCalendarDate(target, delta, unit),
        kind,
        mode,
        yearPage,
        bounds
      );
      setState({
        ...state,
        focusKey: canContinue ? null : calendarCellKey(target, kind, mode),
        view: target,
      });
    }
  };
  const stepAvailable = (delta: number) =>
    calendarPageAvailable(
      shiftCalendarDate(view, delta, kind === "date" ? "month" : "year"),
      kind,
      mode,
      yearPage + delta * YEARS_PER_PAGE,
      bounds
    );
  const openYears = () => {
    if (!disabled) {
      setState({
        ...state,
        focusKey: calendarCellKey(view, kind, "years"),
        mode: "years",
        yearPage: calendarYearPage(view.year),
      });
    }
  };
  const select = (cell: CalendarCell) => {
    if (disabled || cell.disabled) {
      return;
    }
    if (mode === "values") {
      onPick(cell.date);
      return;
    }
    const target = clampCalendarDate(
      shiftCalendarDate(view, cell.date.year - view.year, "year"),
      bounds
    );
    setState({
      ...state,
      focusKey: calendarCellKey(target, kind, "values"),
      mode: "values",
      view: target,
    });
  };
  const navigate = (cell: CalendarCell, key: string, shift: boolean) => {
    let target = navigateCalendarCell(
      cell.date,
      key,
      shift,
      kind,
      mode,
      dir,
      weekStartsOn,
      yearPage
    );
    if (mode === "years") {
      target = shiftCalendarDate(view, target.year - view.year, "year");
    }
    target = clampCalendarDate(target, bounds);
    if (disabled || !inCalendarBounds(target, bounds)) {
      return;
    }
    setState({
      ...state,
      focusKey: calendarCellKey(target, kind, mode),
      view: target,
      yearPage: calendarYearPage(target.year),
    });
  };
  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <Button
          variant="secondary"
          size="small"
          aria-label={mode === "years" ? labels.previousYears : labels.previous}
          disabled={disabled || !stepAvailable(-1)}
          onClick={() => step(-1)}
        >
          {dir === "rtl" ? "›" : "‹"}
        </Button>
        {mode === "years" ? (
          <span className={styles.heading} aria-live="polite">
            {heading}
          </span>
        ) : (
          <Button
            variant="secondary"
            size="small"
            disabled={disabled}
            aria-label={`${labels.chooseYear}: ${heading}`}
            onClick={openYears}
          >
            <span aria-live="polite">{heading}</span>
          </Button>
        )}
        <Button
          variant="secondary"
          size="small"
          aria-label={mode === "years" ? labels.nextYears : labels.next}
          disabled={disabled || !stepAvailable(1)}
          onClick={() => step(1)}
        >
          {dir === "rtl" ? "‹" : "›"}
        </Button>
      </div>
      <CalendarGrid
        label={heading}
        cells={cells}
        columns={mode === "values" && kind === "date" ? DAYS_PER_WEEK : 3}
        weekdays={mode === "values" && kind === "date" ? weekdays : undefined}
        focusKey={focusKey}
        entryKey={focusKey ?? calendarCellKey(view, kind, mode)}
        disabled={disabled}
        dir={dir}
        onSelect={select}
        onNavigate={navigate}
      />
      <div className={styles.footer}>
        <Button
          variant="secondary"
          size="small"
          disabled={disabled}
          onClick={onClear}
        >
          {labels.clear}
        </Button>
        <Button
          variant="secondary"
          size="small"
          disabled={disabled || !inCalendarBounds(today, bounds)}
          onClick={() => onPick(today)}
        >
          {labels.today}
        </Button>
      </div>
    </div>
  );
};
