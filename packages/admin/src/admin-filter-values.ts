import type { AdminFilterDefinition } from "./admin-data-adapter.js";

export const adminFilterSelectionLimit = 50;
const valueLengthLimit = 200;
// JSON can escape one UTF-16 code unit into six characters.
const selectionLengthLimit =
  adminFilterSelectionLimit * (valueLengthLimit * 6 + 3) + 1;

const validateSelection = (value: unknown): string[] => {
  if (!Array.isArray(value) || value.length > adminFilterSelectionLimit) {
    throw new Error("Invalid filter selection.");
  }
  const selection: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (
      typeof item !== "string" ||
      !item ||
      item.length > valueLengthLimit ||
      seen.has(item)
    ) {
      throw new Error("Invalid filter selection.");
    }
    selection.push(item);
    seen.add(item);
  }
  return selection;
};

/** The empty string clears the filter; nonempty selections use a JSON array. */
export const encodeAdminFilterSelection = (
  values: readonly string[]
): string => {
  const validated = validateSelection(values);
  return validated.length ? JSON.stringify(validated) : "";
};

/** Decode the bounded wire value delivered to adapters and shared commands. */
export const decodeAdminFilterSelection = (value: string): string[] => {
  if (!value) {
    return [];
  }
  if (value.length > selectionLengthLimit) {
    throw new Error("Invalid filter selection.");
  }
  return validateSelection(JSON.parse(value));
};

/** null means invalid; an empty string is a valid request to clear a filter. */
export const normalizeAdminFilterValue = (
  filter: AdminFilterDefinition,
  value: unknown
): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  if (filter.multiple) {
    try {
      const values = decodeAdminFilterSelection(value);
      if (
        filter.options &&
        values.some(
          (item) => !filter.options?.some((option) => option.value === item)
        )
      ) {
        return null;
      }
      return encodeAdminFilterSelection(values);
    } catch {
      return null;
    }
  }
  const normalized = value.trim();
  if (
    normalized.length > valueLengthLimit ||
    (normalized &&
      filter.options &&
      !filter.options.some((option) => option.value === normalized))
  ) {
    return null;
  }
  return normalized;
};
