import type {
  AdminFilterDefinition,
  AdminFilterValues,
} from "./admin-data-adapter.js";
import { isAdminNumberValue } from "./admin-number-value.js";

const datePattern = /^\d{4}-\d{2}-\d{2}$/u;
export const isAdminDateValue = (value: string) =>
  datePattern.test(value) &&
  Number(value.slice(0, 4)) > 0 &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
export const isAdminTypedFilterValue = (
  filter: AdminFilterDefinition,
  value: string
) => {
  if (!value) {
    return true;
  }
  if (filter.type === "number") {
    return isAdminNumberValue(value, filter);
  }
  if (filter.type === "date") {
    return (
      isAdminDateValue(value) &&
      (!filter.minDate || value >= filter.minDate) &&
      (!filter.maxDate || value <= filter.maxDate)
    );
  }
  return true;
};
export const invalidAdminFilterRanges = (
  definitions: readonly AdminFilterDefinition[],
  values: AdminFilterValues
) =>
  definitions.filter((filter) => {
    const start = values[filter.key];
    const end = filter.before ? values[filter.before] : undefined;
    if (!start || !end) {
      return false;
    }
    return filter.type === "number" ? Number(start) > Number(end) : start > end;
  });
export const adminFilterDateBounds = (
  filter: AdminFilterDefinition,
  definitions: readonly AdminFilterDefinition[],
  values: AdminFilterValues
) => {
  const minimum = [
    filter.minDate,
    ...definitions.flatMap((other) =>
      other.before === filter.key ? [values[other.key]] : []
    ),
  ]
    .filter(
      (value): value is string => typeof value === "string" && value !== ""
    )
    .toSorted()
    .at(-1);
  const maximum = [
    filter.maxDate,
    filter.before ? values[filter.before] : undefined,
  ]
    .filter(
      (value): value is string => typeof value === "string" && value !== ""
    )
    .toSorted()
    .at(0);
  return {
    ...(minimum ? { minDate: minimum } : {}),
    ...(maximum ? { maxDate: maximum } : {}),
  };
};
const validateNumericBounds = (filter: AdminFilterDefinition) => {
  if (
    [filter.min, filter.max].some(
      (value) => value !== undefined && !Number.isFinite(value)
    ) ||
    (filter.min !== undefined &&
      filter.max !== undefined &&
      filter.min > filter.max)
  ) {
    throw new Error("Invalid numeric filter bounds.");
  }
  if (
    filter.step !== undefined &&
    filter.step !== "any" &&
    (!Number.isFinite(filter.step) || filter.step <= 0)
  ) {
    throw new Error("Invalid numeric filter step.");
  }
};
const validateDateBounds = (filter: AdminFilterDefinition) => {
  if (
    [filter.minDate, filter.maxDate].some(
      (value) => value !== undefined && !isAdminDateValue(value)
    ) ||
    (filter.minDate && filter.maxDate && filter.minDate > filter.maxDate)
  ) {
    throw new Error("Invalid date filter bounds.");
  }
};
export const validateAdminTypedFilters = (
  definitions: readonly AdminFilterDefinition[]
) => {
  for (const filter of definitions) {
    if (filter.type && !["text", "number", "date"].includes(filter.type)) {
      throw new Error("Invalid filter type.");
    }
    if (
      filter.type &&
      filter.type !== "text" &&
      (filter.options || filter.reference || filter.multiple)
    ) {
      throw new Error("Typed scalar filters cannot use choices or references.");
    }
    if (
      filter.maxLength !== undefined &&
      (!Number.isSafeInteger(filter.maxLength) ||
        filter.maxLength < 1 ||
        filter.maxLength > 200)
    ) {
      throw new Error("Invalid filter length.");
    }
    validateNumericBounds(filter);
    validateDateBounds(filter);
    if (
      filter.before &&
      (filter.before === filter.key ||
        !["number", "date"].includes(filter.type ?? "text") ||
        !definitions.some(
          (other) => other.key === filter.before && other.type === filter.type
        ))
    ) {
      throw new Error("Invalid filter range.");
    }
  }
};
