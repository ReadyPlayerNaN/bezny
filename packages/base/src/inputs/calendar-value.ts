export type CalendarKind = "date" | "month";
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}
export interface CalendarBounds {
  min: CalendarDate;
  max: CalendarDate;
}
export type CalendarField = "year" | "month" | "day";
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_WEEK = 7;
export const YEARS_PER_PAGE = 12;
const DATE_PATTERN = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u;
const MONTH_PATTERN = /^(?<year>\d{4})-(?<month>\d{2})$/u;
const DIGITS = /\d+/gu;
const SEPARATED_NUMBERS = /^\d[\d\s./-]*\d$/u;
const BIDI_MARKS = /[\u061C\u200E\u200F]/gu;
const CZECH_OR_SLOVAK = /^(?:cs|sk)\b/u;
const MAX_YEAR = 9999;
const CENTURY = 100;
const YEAR_DIGITS = 4;
const FIELD_DIGITS = 2;
const REFERENCE: CalendarDate = { day: 22, month: 12, year: 2999 };

/** UTC is only an arithmetic/Intl carrier. Public values remain Gregorian date-only strings. */
export const calendarDate = ({ year, month, day }: CalendarDate): Date => {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
};
export const calendarParts = (date: Date): CalendarDate => ({
  day: date.getUTCDate(),
  month: date.getUTCMonth() + 1,
  year: date.getUTCFullYear(),
});
export const calendarValue = (
  date: CalendarDate,
  kind: CalendarKind
): string => {
  const month = `${String(date.year).padStart(YEAR_DIGITS, "0")}-${String(date.month).padStart(FIELD_DIGITS, "0")}`;
  return kind === "month"
    ? month
    : `${month}-${String(date.day).padStart(FIELD_DIGITS, "0")}`;
};
export const validCalendarDate = (date: CalendarDate): boolean => {
  if (
    date.year < 1 ||
    date.year > MAX_YEAR ||
    date.month < 1 ||
    date.month > MONTHS_PER_YEAR ||
    date.day < 1
  ) {
    return false;
  }
  const result = calendarParts(calendarDate(date));
  return (
    result.year === date.year &&
    result.month === date.month &&
    result.day === date.day
  );
};
export const parseCalendarValue = (
  value: string,
  kind: CalendarKind
): CalendarDate | null => {
  const groups = (kind === "date" ? DATE_PATTERN : MONTH_PATTERN).exec(
    value
  )?.groups;
  if (!groups) {
    return null;
  }
  const result = {
    day: kind === "date" ? Number(groups.day) : 1,
    month: Number(groups.month),
    year: Number(groups.year),
  };
  return validCalendarDate(result) ? result : null;
};
export const localCalendarToday = (kind: CalendarKind): string => {
  const now = new Date();
  return calendarValue(
    { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() },
    kind
  );
};
export const calendarFormatter = (
  locale: string,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat(locale, {
    ...options,
    calendar: "gregory",
    timeZone: "UTC",
  });
const editableFormatter = (
  locale: string,
  kind: CalendarKind
): Intl.DateTimeFormat =>
  calendarFormatter(locale, {
    month: "2-digit",
    year: "numeric",
    ...(kind === "date" ? { day: "2-digit" } : {}),
  });
export const formatCalendarValue = (
  value: string,
  kind: CalendarKind,
  locale: string
): string => {
  const parsed = parseCalendarValue(value, kind);
  if (!parsed) {
    return value;
  }
  const zero = new Intl.NumberFormat(locale).format(0);
  return editableFormatter(locale, kind)
    .formatToParts(calendarDate(parsed))
    .map((part) =>
      part.type === "year" ? part.value.padStart(YEAR_DIGITS, zero) : part.value
    )
    .join("");
};
export const calendarPlaceholder = (
  kind: CalendarKind,
  locale: string
): string =>
  editableFormatter(locale, kind)
    .formatToParts(calendarDate(REFERENCE))
    .map((part) => {
      if (part.type === "year") {
        return CZECH_OR_SLOVAK.test(locale) ? "rrrr" : "yyyy";
      }
      if (part.type === "month") {
        return "mm";
      }
      if (part.type === "day") {
        return "dd";
      }
      return part.value;
    })
    .join("");
const normalizeDigits = (input: string, locale: string): string => {
  let result = input.replaceAll(BIDI_MARKS, "");
  const formatter = new Intl.NumberFormat(locale, { useGrouping: false });
  for (let digit = 0; digit < 10; digit += 1) {
    result = result.replaceAll(formatter.format(digit), String(digit));
  }
  return result;
};
const splitCompact = (
  digits: string,
  order: CalendarField[]
): string[] | null => {
  const nonYearLength = (order.length - 1) * FIELD_DIGITS;
  const yearWidth = digits.length - nonYearLength;
  if (yearWidth !== FIELD_DIGITS && yearWidth !== YEAR_DIGITS) {
    return null;
  }
  let cursor = 0;
  return order.map((field) => {
    const width = field === "year" ? yearWidth : FIELD_DIGITS;
    const part = digits.slice(cursor, cursor + width);
    cursor += width;
    return part;
  });
};
const readTypedParts = (
  groups: string[],
  order: CalendarField[],
  currentYear: number
): CalendarDate | null => {
  const result: CalendarDate = { day: 1, month: 0, year: 0 };
  for (const [index, field] of order.entries()) {
    const raw = groups[index];
    if (!raw) {
      return null;
    }
    if (field !== "year" && raw.length > FIELD_DIGITS) {
      return null;
    }
    if (
      field === "year" &&
      raw.length > FIELD_DIGITS &&
      raw.length !== YEAR_DIGITS
    ) {
      return null;
    }
    let value = Number(raw);
    if (field === "year" && raw.length <= FIELD_DIGITS) {
      value += Math.floor(currentYear / CENTURY) * CENTURY;
      if (value > currentYear) {
        value -= CENTURY;
      }
    }
    result[field] = value;
  }
  return validCalendarDate(result) ? result : null;
};
export const parseCalendarDraft = (
  input: string,
  kind: CalendarKind,
  locale: string,
  currentYear: number
): CalendarDate | null => {
  const canonical = parseCalendarValue(input.trim(), kind);
  if (canonical) {
    return canonical;
  }
  const parts = editableFormatter(locale, kind).formatToParts(
    calendarDate(REFERENCE)
  );
  const order = parts.flatMap((part): CalendarField[] =>
    part.type === "year" || part.type === "month" || part.type === "day"
      ? [part.type]
      : []
  );
  let text = normalizeDigits(input, locale);
  for (const part of parts) {
    if (part.type === "literal" || part.type === "era") {
      const literal = normalizeDigits(part.value, locale);
      if (literal) {
        text = text.replaceAll(literal, " ");
      }
    }
  }
  if (!SEPARATED_NUMBERS.test(text.trim())) {
    return null;
  }
  let groups: string[] = text.match(DIGITS) ?? [];
  if (groups.length === 1) {
    groups = splitCompact(groups[0] ?? "", order) ?? [];
  }
  if (groups.length !== order.length) {
    return null;
  }
  return readTypedParts(groups, order, currentYear);
};
export const compareCalendarDates = (
  first: CalendarDate,
  second: CalendarDate
): number => calendarDate(first).getTime() - calendarDate(second).getTime();
export const calendarBounds = (
  kind: CalendarKind,
  min?: string,
  max?: string,
  minYear = 1
): CalendarBounds => {
  if (!Number.isInteger(minYear) || minYear < 1 || minYear > MAX_YEAR) {
    throw new RangeError("minYear must be an integer from 1 to 9999");
  }
  let minimum: CalendarDate = { day: 1, month: 1, year: minYear };
  let maximum: CalendarDate = {
    day: kind === "date" ? 31 : 1,
    month: MONTHS_PER_YEAR,
    year: MAX_YEAR,
  };
  if (min) {
    const parsed = parseCalendarValue(min, kind);
    if (!parsed) {
      throw new RangeError(`Invalid ${kind} minimum`);
    }
    if (compareCalendarDates(parsed, minimum) > 0) {
      minimum = parsed;
    }
  }
  if (max) {
    const parsed = parseCalendarValue(max, kind);
    if (!parsed) {
      throw new RangeError(`Invalid ${kind} maximum`);
    }
    maximum = parsed;
  }
  return { max: maximum, min: minimum };
};
export const inCalendarBounds = (
  date: CalendarDate,
  bounds: CalendarBounds
): boolean =>
  validCalendarDate(date) &&
  compareCalendarDates(date, bounds.min) >= 0 &&
  compareCalendarDates(date, bounds.max) <= 0;
export const clampCalendarDate = (
  date: CalendarDate,
  bounds: CalendarBounds
): CalendarDate => {
  if (compareCalendarDates(date, bounds.min) < 0) {
    return bounds.min;
  }
  if (compareCalendarDates(date, bounds.max) > 0) {
    return bounds.max;
  }
  return date;
};
export const shiftCalendarDate = (
  date: CalendarDate,
  amount: number,
  unit: "day" | "month" | "year"
): CalendarDate => {
  const shifted = calendarDate(date);
  if (unit === "day") {
    shifted.setUTCDate(shifted.getUTCDate() + amount);
    return calendarParts(shifted);
  }
  shifted.setUTCDate(1);
  shifted.setUTCMonth(
    shifted.getUTCMonth() +
      (unit === "year" ? amount * MONTHS_PER_YEAR : amount)
  );
  const last = new Date(shifted);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  shifted.setUTCDate(Math.min(date.day, last.getUTCDate()));
  return calendarParts(shifted);
};
export const calendarMonthCells = (
  view: CalendarDate,
  weekStartsOn: number
): CalendarDate[] => {
  const first = { ...view, day: 1 };
  const offset =
    (calendarDate(first).getUTCDay() - weekStartsOn + DAYS_PER_WEEK) %
    DAYS_PER_WEEK;
  const weeksInGrid = 6;
  return Array.from({ length: DAYS_PER_WEEK * weeksInGrid }, (_, index) =>
    shiftCalendarDate(first, index - offset, "day")
  );
};
export const calendarYearPage = (year: number): number =>
  Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
