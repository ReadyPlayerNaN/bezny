import type { PopoverContentProps } from "../controls/popover.js";
import type { CalendarKind } from "./calendar-value.js";
import type { TextInputProps } from "./text-input.js";

export interface CalendarInputLabels {
  open: string;
  clear: string;
  today: string;
  previous: string;
  next: string;
  chooseYear: string;
  previousYears: string;
  nextYears: string;
  invalid: string;
  outOfRange: string;
}
export type DateInputProps = Omit<
  TextInputProps,
  "value" | "defaultValue" | "onChange" | "onBlur" | "type" | "min" | "max"
> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Raw editing notification, before canonical commit. RHF fields use it to avoid stale submitted values. */
  onDraftChange?: (draft: string) => void;
  onBlur?: () => void;
  locale?: string;
  min?: string;
  max?: string;
  minYear?: number;
  today?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  labels?: Partial<CalendarInputLabels>;
  portalContainer?: PopoverContentProps["container"];
};
export type MonthInputProps = Omit<DateInputProps, "weekStartsOn">;
export const calendarInputLabels = (
  kind: CalendarKind,
  labels: Partial<CalendarInputLabels> | undefined
): CalendarInputLabels => ({
  chooseYear: "Choose year",
  clear: "Clear",
  invalid: kind === "date" ? "Enter a valid date" : "Enter a valid month",
  next: kind === "date" ? "Next month" : "Next year",
  nextYears: "Next years",
  open: kind === "date" ? "Open calendar" : "Choose month",
  outOfRange: "Choose a value within the allowed range",
  previous: kind === "date" ? "Previous month" : "Previous year",
  previousYears: "Previous years",
  today: kind === "date" ? "Today" : "Current month",
  ...labels,
});
