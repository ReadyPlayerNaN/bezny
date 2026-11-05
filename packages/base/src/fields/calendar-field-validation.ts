import type { FieldValues, UseControllerProps } from "react-hook-form";

import { calendarInputLabels } from "../inputs/calendar-input-props.js";
import type { DateInputProps } from "../inputs/calendar-input-props.js";
import {
  calendarBounds,
  inCalendarBounds,
  parseCalendarValue,
} from "../inputs/calendar-value.js";
import type { CalendarKind } from "../inputs/calendar-value.js";

type ValidationOptions = Pick<
  DateInputProps,
  "min" | "max" | "minYear" | "labels"
>;
export const calendarFieldRules = <T extends FieldValues>(
  rules: UseControllerProps<T>["rules"],
  kind: CalendarKind,
  options: ValidationOptions
): NonNullable<UseControllerProps<T>["rules"]> => {
  const bounds = calendarBounds(
    kind,
    options.min,
    options.max,
    options.minYear
  );
  const labels = calendarInputLabels(kind, options.labels);
  const validate = (value: unknown): string | true => {
    if (value === "" || value === null || value === undefined) {
      return true;
    }
    if (typeof value !== "string") {
      return labels.invalid;
    }
    const parsed = parseCalendarValue(value, kind);
    if (!parsed) {
      return labels.invalid;
    }
    return inCalendarBounds(parsed, bounds) || labels.outOfRange;
  };
  const supplied = rules?.validate;
  const validators =
    typeof supplied === "function" ? { validate: supplied } : { ...supplied };
  let key = "calendar";
  while (key in validators) {
    key = `_${key}`;
  }
  return { ...rules, validate: { [key]: validate, ...validators } };
};
