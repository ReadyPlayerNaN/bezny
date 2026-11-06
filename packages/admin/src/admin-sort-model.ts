export interface AdminSortField {
  key: string;
  label: string;
  labelKey?: string;
}
export interface AdminSortRule {
  key: string;
  direction: "asc" | "desc";
}
export interface AdminSortingDefinition {
  fields: readonly AdminSortField[];
  default?: readonly AdminSortRule[];
}

export const adminSortKey = (rules: readonly AdminSortRule[] = []) =>
  JSON.stringify(rules.map(({ key, direction }) => [key, direction]));

export const adminSortLimit = 50;
const keyLimit = 200;
const labelLimit = 1000;
const inputLimit = adminSortLimit * (keyLimit * 6 + 50) + 2;

/** Canonical owned rules: priority is meaningful and must never be alphabetized. */
export const readAdminSort = (
  value: unknown,
  definition?: AdminSortingDefinition
): readonly AdminSortRule[] | null => {
  if (!Array.isArray(value) || value.length > adminSortLimit) {
    return null;
  }
  const available = new Set(definition?.fields.map(({ key }) => key));
  const seen = new Set<string>();
  const rules: AdminSortRule[] = [];
  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.key !== "string" ||
      !available.has(item.key) ||
      seen.has(item.key) ||
      (item.direction !== "asc" && item.direction !== "desc")
    ) {
      return null;
    }
    seen.add(item.key);
    rules.push(Object.freeze({ direction: item.direction, key: item.key }));
  }
  return Object.freeze(rules);
};

export const readAdminSortInput = (
  value: string,
  definition: AdminSortingDefinition
) => {
  if (value.length > inputLimit) {
    return null;
  }
  try {
    return readAdminSort(JSON.parse(value), definition);
  } catch {
    return null;
  }
};

export const validateAdminSorting = (definition?: AdminSortingDefinition) => {
  if (!definition) {
    return;
  }
  if (
    !Array.isArray(definition.fields) ||
    !definition.fields.length ||
    definition.fields.length > adminSortLimit
  ) {
    throw new Error("Sorting requires between 1 and 50 registered fields.");
  }
  const keys = new Set<string>();
  for (const field of definition.fields) {
    if (
      !field ||
      typeof field.key !== "string" ||
      !field.key ||
      field.key.length > keyLimit ||
      typeof field.label !== "string" ||
      !field.label ||
      field.label.length > labelLimit ||
      keys.has(field.key)
    ) {
      throw new Error("Invalid or duplicate sorting field.");
    }
    keys.add(field.key);
  }
  if (readAdminSort(definition.default ?? [], definition) === null) {
    throw new Error("Invalid default sorting.");
  }
};
