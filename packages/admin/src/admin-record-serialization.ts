import type { AdminRecordEnvelope } from "./admin-data-adapter.js";

const maxRecordDepth = 32;
const maxRecordNodes = 100_000;
const isJsonScalar = (value: unknown) =>
  value === null ||
  typeof value === "string" ||
  typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value));
const jsonPropertyValue = (value: object, key: string): unknown => {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (
    !descriptor ||
    descriptor.get ||
    descriptor.set ||
    !descriptor.enumerable
  ) {
    throw new TypeError("Record data contains a non-JSON property.");
  }
  return descriptor.value;
};
const assertJsonValue = (
  value: unknown,
  depth: number,
  ancestors: WeakSet<object>,
  budget: { remaining: number }
): void => {
  budget.remaining -= 1;
  if (depth > maxRecordDepth || budget.remaining < 0) {
    throw new Error("Record data exceeds the structural budget.");
  }
  if (isJsonScalar(value)) {
    return;
  }
  if (typeof value !== "object" || value === null) {
    throw new TypeError("Record data must be plain JSON data.");
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  if (
    !Array.isArray(value) &&
    prototype !== Object.prototype &&
    prototype !== null
  ) {
    throw new TypeError("Record data must be plain JSON data.");
  }
  if (ancestors.has(value) || Object.getOwnPropertySymbols(value).length > 0) {
    throw new TypeError("Record data contains a cycle or symbol property.");
  }
  const keys = Object.getOwnPropertyNames(value);
  if (keys.length > budget.remaining) {
    throw new Error("Record data exceeds the structural budget.");
  }
  ancestors.add(value);
  for (const key of keys) {
    if (Array.isArray(value) && key === "length") {
      continue;
    }
    const child = jsonPropertyValue(value, key);
    // Optional DTO properties may be undefined; serialization omits them.
    if (child !== undefined) {
      assertJsonValue(child, depth + 1, ancestors, budget);
    }
  }
  ancestors.delete(value);
};

/** Canonical copies cannot retain hidden adapter objects, DOM nodes, or backend collection references. */
const freezeJsonValue = (value: unknown): void => {
  if (typeof value !== "object" || value === null) {
    return;
  }
  for (const child of Object.values(value)) {
    freezeJsonValue(child);
  }
  Object.freeze(value);
};
export const serializeAdminRecords = (
  records: readonly AdminRecordEnvelope[],
  maxBytes: number
) => {
  assertJsonValue(records, 0, new WeakSet(), { remaining: maxRecordNodes });
  const serialized = JSON.stringify(records);
  const bytes = serialized.length * 2;
  if (bytes > maxBytes) {
    throw new Error("Adapter payload exceeds the configured data budget.");
  }
  const decoded: unknown = JSON.parse(serialized);
  if (!Array.isArray(decoded)) {
    throw new TypeError("Invalid serialized record page.");
  }
  const items: AdminRecordEnvelope[] = [];
  for (const candidate of decoded) {
    const value: unknown = candidate;
    if (
      typeof value !== "object" ||
      value === null ||
      !("id" in value) ||
      typeof value.id !== "string" ||
      !("label" in value) ||
      typeof value.label !== "string" ||
      !("data" in value)
    ) {
      throw new TypeError("Invalid serialized record envelope.");
    }
    items.push({ data: value.data, id: value.id, label: value.label });
  }
  freezeJsonValue(items);
  return { bytes, items };
};
