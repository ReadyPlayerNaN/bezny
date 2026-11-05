import type { CalendarCell, CalendarWeekday } from "./calendar-grid.js";
import {
  calendarDate,
  calendarFormatter,
  calendarMonthCells,
  calendarValue,
  compareCalendarDates,
  DAYS_PER_WEEK,
  inCalendarBounds,
  MONTHS_PER_YEAR,
  shiftCalendarDate,
  YEARS_PER_PAGE,
} from "./calendar-value.js";
import type {
  CalendarBounds,
  CalendarDate,
  CalendarKind,
} from "./calendar-value.js";

export type CalendarMode = "values" | "years";
export const calendarPageFormats = (kind: CalendarKind, locale: string) => ({
  heading: calendarFormatter(locale, { month: "long", year: "numeric" }),
  long: calendarFormatter(locale, {
    month: "long",
    year: "numeric",
    ...(kind === "date" ? { day: "numeric" } : {}),
  }),
  numbers: new Intl.NumberFormat(locale, { useGrouping: false }),
  short: calendarFormatter(locale, { month: "short" }),
});
export interface CalendarPageOptions {
  kind: CalendarKind;
  mode: CalendarMode;
  view: CalendarDate;
  yearPage: number;
  selected: CalendarDate | null;
  today: CalendarDate;
  bounds: CalendarBounds;
  formats: ReturnType<typeof calendarPageFormats>;
  weekStartsOn: number;
}
export const calendarCellKey = (
  date: CalendarDate,
  kind: CalendarKind,
  mode: CalendarMode
): string =>
  mode === "years"
    ? `year-${date.year}`
    : `${kind}-${calendarValue(date, kind)}`;
export const calendarPageAvailable = (
  view: CalendarDate,
  kind: CalendarKind,
  mode: CalendarMode,
  yearPage: number,
  bounds: CalendarBounds
): boolean => {
  let first = { ...view, day: 1 };
  let last = shiftCalendarDate(shiftCalendarDate(first, 1, "month"), -1, "day");
  if (kind === "month" || mode === "years") {
    first = { day: 1, month: 1, year: mode === "years" ? yearPage : view.year };
    last = {
      day: kind === "date" ? 31 : 1,
      month: MONTHS_PER_YEAR,
      year: mode === "years" ? yearPage + YEARS_PER_PAGE - 1 : view.year,
    };
  }
  return (
    compareCalendarDates(bounds.min, bounds.max) <= 0 &&
    compareCalendarDates(last, bounds.min) >= 0 &&
    compareCalendarDates(first, bounds.max) <= 0
  );
};
export const createCalendarCells = (
  options: CalendarPageOptions
): CalendarCell[] => {
  const {
    kind,
    mode,
    view,
    yearPage,
    selected,
    today,
    bounds,
    formats,
    weekStartsOn,
  } = options;
  let dates: CalendarDate[];
  if (mode === "years") {
    dates = Array.from({ length: YEARS_PER_PAGE }, (_, index) => ({
      ...view,
      day: 1,
      year: yearPage + index,
    }));
  } else if (kind === "month") {
    dates = Array.from({ length: MONTHS_PER_YEAR }, (_, index) => ({
      day: 1,
      month: index + 1,
      year: view.year,
    }));
  } else {
    dates = calendarMonthCells(view, weekStartsOn);
  }
  const { short, long, numbers } = formats;
  const selectedKey = selected ? calendarCellKey(selected, kind, mode) : null;
  const todayKey = calendarCellKey(today, kind, mode);
  return dates.map((date) => {
    const key = calendarCellKey(date, kind, mode);
    let label = numbers.format(date.day);
    let accessibleLabel = long.format(calendarDate(date));
    let disabled = !inCalendarBounds(date, bounds);
    if (mode === "years") {
      label = numbers.format(date.year);
      accessibleLabel = label;
      disabled =
        date.year < bounds.min.year ||
        date.year > bounds.max.year ||
        compareCalendarDates(bounds.min, bounds.max) > 0;
    } else if (kind === "month") {
      label = short.format(calendarDate(date));
    }
    return {
      accessibleLabel,
      current: key === todayKey,
      date,
      disabled,
      key,
      label,
      outside:
        mode === "values" && kind === "date" && date.month !== view.month,
      selected: key === selectedKey,
    };
  });
};
export const calendarWeekdays = (
  locale: string,
  weekStartsOn: number
): CalendarWeekday[] => {
  const sunday = { day: 7, month: 1, year: 2024 };
  const short = calendarFormatter(locale, { weekday: "narrow" });
  const long = calendarFormatter(locale, { weekday: "long" });
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) => {
    const date = shiftCalendarDate(sunday, weekStartsOn + index, "day");
    return {
      key: String(index),
      long: long.format(calendarDate(date)),
      short: short.format(calendarDate(date)),
    };
  });
};
export const navigateCalendarCell = (
  date: CalendarDate,
  key: string,
  shift: boolean,
  kind: CalendarKind,
  mode: CalendarMode,
  dir: "ltr" | "rtl",
  weekStartsOn: number,
  yearPage: number
): CalendarDate => {
  const dayMode = kind === "date" && mode === "values";
  const columns = dayMode ? DAYS_PER_WEEK : 3;
  let unit: "day" | "month" | "year" = kind === "date" ? "day" : "month";
  if (mode === "years") {
    unit = "year";
  }
  const horizontal = dir === "rtl" ? -1 : 1;
  const arrows: Record<string, number> = {
    ArrowDown: columns,
    ArrowLeft: -horizontal,
    ArrowRight: horizontal,
    ArrowUp: -columns,
  };
  if (arrows[key] !== undefined) {
    return shiftCalendarDate(date, arrows[key], unit);
  }
  if (key === "PageUp" || key === "PageDown") {
    const delta = key === "PageUp" ? -1 : 1;
    if (mode === "years") {
      return shiftCalendarDate(date, delta * YEARS_PER_PAGE, "year");
    }
    if (kind === "month" || shift) {
      return shiftCalendarDate(date, delta, "year");
    }
    return shiftCalendarDate(date, delta, "month");
  }
  let offset = (date.month - 1) % columns;
  if (dayMode) {
    offset =
      (calendarDate(date).getUTCDay() - weekStartsOn + DAYS_PER_WEEK) %
      DAYS_PER_WEEK;
  }
  if (mode === "years") {
    offset = (date.year - yearPage) % columns;
  }
  return shiftCalendarDate(
    date,
    key === "Home" ? -offset : columns - 1 - offset,
    unit
  );
};
