import { afterEach, describe, expect, it, vi } from "vitest";

import { navigateCalendarCell } from "../src/inputs/calendar-pages.js";
import {
  calendarBounds,
  calendarMonthCells,
  calendarValue,
  formatCalendarValue,
  inCalendarBounds,
  parseCalendarDraft,
  parseCalendarValue,
  shiftCalendarDate,
} from "../src/inputs/calendar-value.js";
import type { CalendarKind } from "../src/inputs/calendar-value.js";

describe("Gregorian calendar values", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    "2023-02-29",
    "2024-02-31",
    "2024-00-01",
    "2024-13-01",
    "0000-01-01",
    "2024-01-00",
    "2024-1-1",
    "10000-01-01",
    "2024-01-01T00:00:00Z",
  ])("rejects invalid canonical date %s", (value) => {
    expect(parseCalendarValue(value, "date")).toBeNull();
  });

  it.each(["2024-00", "2024-13", "0000-01", "2024-1", "2024-01-01"])(
    "rejects invalid canonical month %s",
    (value) => {
      expect(parseCalendarValue(value, "month")).toBeNull();
    }
  );

  it.each(["en-US", "cs-CZ", "ja-JP", "ar-EG", "ar-SA", "th-TH"])(
    "round-trips localized Gregorian dates and months in %s",
    (locale) => {
      const date = formatCalendarValue("2024-02-29", "date", locale);
      const month = formatCalendarValue("2024-02", "month", locale);
      expect(parseCalendarDraft(date, "date", locale, 2026)).toStrictEqual({
        day: 29,
        month: 2,
        year: 2024,
      });
      expect(parseCalendarDraft(month, "month", locale, 2026)).toStrictEqual({
        day: 1,
        month: 2,
        year: 2024,
      });
      expect(
        parseCalendarDraft(
          formatCalendarValue("0001-01-01", "date", locale),
          "date",
          locale,
          2026
        )
      ).toStrictEqual({ day: 1, month: 1, year: 1 });
    }
  );

  it.each([
    ["02292024", "date", "en-US", "2024-02-29"],
    ["290224", "date", "cs", "2024-02-29"],
    ["20240229", "date", "ja", "2024-02-29"],
    ["022024", "month", "en-US", "2024-02"],
    ["0227", "month", "en-US", "1927-02"],
    ["02/26", "month", "en-US", "2026-02"],
  ] as const)(
    "parses compact or short-year %s",
    (input, kind, locale, expected) => {
      const parsed = parseCalendarDraft(input, kind, locale, 2026);
      expect(parsed && calendarValue(parsed, kind)).toBe(expected);
    }
  );

  it.each([
    "31/02/2024",
    "31/12/123",
    "31/12/12345",
    "words 31/12/2024",
    "-31/12/2024",
    "31122",
  ])("rejects invalid typed date %s", (value) => {
    expect(parseCalendarDraft(value, "date", "en-GB", 2026)).toBeNull();
  });

  it.each(["UTC", "America/Los_Angeles", "Pacific/Kiritimati"])(
    "does not shift date-only values in %s",
    (timezone) => {
      vi.stubEnv("TZ", timezone);
      expect(formatCalendarValue("2024-03-10", "date", "en-US")).toBe(
        "03/10/2024"
      );
      expect(
        parseCalendarDraft("03/10/2024", "date", "en-US", 2026)
      ).toStrictEqual({ day: 10, month: 3, year: 2024 });
      expect(
        shiftCalendarDate({ day: 10, month: 3, year: 2024 }, 1, "day")
      ).toStrictEqual({ day: 11, month: 3, year: 2024 });
    }
  );

  it("clamps calendar arithmetic without rolling February into March", () => {
    expect(
      shiftCalendarDate({ day: 31, month: 1, year: 2024 }, 1, "month")
    ).toStrictEqual({ day: 29, month: 2, year: 2024 });
    expect(
      shiftCalendarDate({ day: 29, month: 2, year: 2024 }, 1, "year")
    ).toStrictEqual({ day: 28, month: 2, year: 2025 });
  });

  it.each(["date", "month"] as CalendarKind[])(
    "applies inclusive bounds and caller minimum year for %s",
    (kind) => {
      const bounds = calendarBounds(kind, undefined, undefined, 1900);
      expect(
        inCalendarBounds({ day: 1, month: 1, year: 1899 }, bounds)
      ).toBeFalsy();
      expect(
        inCalendarBounds({ day: 1, month: 1, year: 1900 }, bounds)
      ).toBeTruthy();
      expect(
        inCalendarBounds({ day: 1, month: 1, year: 1 }, calendarBounds(kind))
      ).toBeTruthy();
    }
  );

  it("treats inverted bounds as an empty selection range and rejects malformed bounds", () => {
    const bounds = calendarBounds("date", "2024-06-01", "2024-05-01");
    expect(
      inCalendarBounds({ day: 15, month: 5, year: 2024 }, bounds)
    ).toBeFalsy();
    expect(() => calendarBounds("date", "2024-02-31")).toThrow(RangeError);
  });

  it("builds a stable six-week grid and supports row, page and RTL keyboard navigation", () => {
    const date = { day: 29, month: 2, year: 2024 };
    const cells = calendarMonthCells(date, 1);
    expect(cells).toHaveLength(42);
    expect(cells[0]).toStrictEqual({ day: 29, month: 1, year: 2024 });
    expect(
      navigateCalendarCell(
        date,
        "Home",
        false,
        "date",
        "values",
        "ltr",
        1,
        2016
      )
    ).toStrictEqual({ day: 26, month: 2, year: 2024 });
    expect(
      navigateCalendarCell(
        date,
        "ArrowRight",
        false,
        "date",
        "values",
        "rtl",
        1,
        2016
      )
    ).toStrictEqual({ day: 28, month: 2, year: 2024 });
    expect(
      navigateCalendarCell(
        date,
        "PageDown",
        true,
        "date",
        "values",
        "ltr",
        1,
        2016
      )
    ).toStrictEqual({ day: 28, month: 2, year: 2025 });
  });
});
