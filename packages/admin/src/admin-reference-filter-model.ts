import type {
  AdminAdapterRequest,
  AdminFilterDefinition,
} from "./admin-data-adapter.js";

export interface AdminFilterReference {
  value: string;
  label: string;
}
export interface AdminReferenceFilterRequest extends AdminAdapterRequest {
  /** Maximum result count. Return fewer results instead of an unbounded collection. */
  limit: number;
}
export interface AdminReferenceFilterSource {
  search: (
    query: string,
    request: AdminReferenceFilterRequest
  ) => Promise<readonly AdminFilterReference[]>;
  /** Omit missing references; their IDs remain selected and removable. */
  resolve: (
    values: readonly string[],
    request: AdminReferenceFilterRequest
  ) => Promise<readonly AdminFilterReference[]>;
}
export interface AdminReferenceFilterScope {
  locale: string;
  isCurrent: () => boolean;
  subscribe: (notify: () => void) => () => void;
}
export interface AdminReferenceFilterInput {
  source: AdminReferenceFilterSource;
  scope: AdminReferenceFilterScope;
}

export const validateAdminReferenceRegistration = (
  filter: AdminFilterDefinition
) => {
  if (
    filter.reference !== undefined &&
    (!filter.reference ||
      filter.options ||
      typeof filter.reference.search !== "function" ||
      typeof filter.reference.resolve !== "function")
  ) {
    throw new Error(`Invalid reference filter: ${filter.key}`);
  }
};

export const adminReferenceSearchLimit = 20;
export const adminReferenceQueryLimit = 200;
export const adminReferenceDebounceMs = 250;

export const validateAdminFilterReferences = (
  result: readonly AdminFilterReference[],
  limit: number,
  requested?: readonly string[]
): readonly AdminFilterReference[] => {
  if (!Array.isArray(result) || result.length > limit) {
    throw new Error("Invalid reference filter result.");
  }
  const seen = new Set<string>();
  const allowed = requested ? new Set(requested) : null;
  for (const option of result) {
    if (
      !option ||
      typeof option.value !== "string" ||
      !option.value ||
      option.value.length > 200 ||
      typeof option.label !== "string" ||
      !option.label ||
      option.label.length > 1000 ||
      seen.has(option.value) ||
      (allowed && !allowed.has(option.value))
    ) {
      throw new Error("Invalid reference filter result.");
    }
    seen.add(option.value);
  }
  return result.map(({ value, label }) => ({ label, value }));
};
