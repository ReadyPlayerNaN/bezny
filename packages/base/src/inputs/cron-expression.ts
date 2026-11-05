import cronstrue from "cronstrue";

export type CronMode = "hourly" | "daily" | "weekly" | "monthly" | "custom";
export interface CronParts {
  minute: number;
  hour: number;
  hourInterval: number;
  daysOfWeek: number[];
  daysOfMonth: number[];
  custom: string;
}
export interface CronDetection {
  mode: CronMode;
  parts: CronParts;
}
const numberPattern = /^\d+$/u;
const listPattern = /^\d+(?:,\d+)*$/u;
const intervalPattern = /^\*\/(?<every>\d+)$/u;
const whitespace = /\s+/u;
const numberInRange = (
  value: string,
  minimum: number,
  maximum: number
): number | null => {
  if (!numberPattern.test(value)) {
    return null;
  }
  const number = Number(value);
  return number >= minimum && number <= maximum ? number : null;
};
const daysInRange = (
  value: string,
  minimum: number,
  maximum: number
): number[] | null => {
  if (!listPattern.test(value)) {
    return null;
  }
  const days = [...new Set(value.split(",").map(Number))].toSorted(
    (a, b) => a - b
  );
  return days.every((day) => day >= minimum && day <= maximum) ? days : null;
};
const detectWithHour = (
  parts: CronParts,
  dayOfMonth: string,
  dayOfWeek: string
): CronDetection | null => {
  if (dayOfMonth === "*" && dayOfWeek === "*") {
    return { mode: "daily", parts };
  }
  if (dayOfMonth === "*") {
    const days = daysInRange(dayOfWeek, 0, 6);
    if (days) {
      return { mode: "weekly", parts: { ...parts, daysOfWeek: days } };
    }
  }
  if (dayOfWeek === "*") {
    const days = daysInRange(dayOfMonth, 1, 31);
    if (days) {
      return { mode: "monthly", parts: { ...parts, daysOfMonth: days } };
    }
  }
  return null;
};

/** Detect only expressions the builder can represent; never rewrite custom source. */
export const parseCronExpression = (value: string): CronDetection => {
  const parts: CronParts = {
    custom: value,
    daysOfMonth: [1],
    daysOfWeek: [1],
    hour: 0,
    hourInterval: 1,
    minute: 0,
  };
  const fallback: CronDetection = { mode: "custom", parts };
  const fields = value.trim().split(whitespace);
  if (fields.length !== 5) {
    return fallback;
  }
  const [
    minuteField = "",
    hourField = "",
    dayOfMonth = "",
    month = "",
    dayOfWeek = "",
  ] = fields;
  const minute = numberInRange(minuteField, 0, 59);
  if (month !== "*" || minute === null) {
    return fallback;
  }
  if (dayOfMonth === "*" && dayOfWeek === "*") {
    const interval =
      hourField === "*"
        ? 1
        : Number(intervalPattern.exec(hourField)?.groups?.every);
    if (Number.isInteger(interval) && interval >= 1 && interval <= 12) {
      return {
        mode: "hourly",
        parts: { ...parts, hourInterval: interval, minute },
      };
    }
  }
  const hour = numberInRange(hourField, 0, 23);
  if (hour === null) {
    return fallback;
  }
  return (
    detectWithHour({ ...parts, hour, minute }, dayOfMonth, dayOfWeek) ??
    fallback
  );
};

const sortedDays = (days: readonly number[]) =>
  days.length ? [...new Set(days)].toSorted((a, b) => a - b).join(",") : "*";
export const buildCronExpression = (
  mode: CronMode,
  parts: CronParts
): string => {
  switch (mode) {
    case "hourly": {
      return `${parts.minute} ${parts.hourInterval === 1 ? "*" : `*/${parts.hourInterval}`} * * *`;
    }
    case "daily": {
      return `${parts.minute} ${parts.hour} * * *`;
    }
    case "weekly": {
      return `${parts.minute} ${parts.hour} * * ${sortedDays(parts.daysOfWeek)}`;
    }
    case "monthly": {
      return `${parts.minute} ${parts.hour} ${sortedDays(parts.daysOfMonth)} * *`;
    }
    default: {
      return parts.custom;
    }
  }
};

/** Preview only, not the consuming application's cron validation policy. */
export const describeCronExpression = (
  value: string,
  invalid: string
): string => {
  if (value.trim().split(whitespace).length !== 5) {
    return invalid;
  }
  try {
    return cronstrue.toString(value, { use24HourTimeFormat: false });
  } catch {
    return invalid;
  }
};
