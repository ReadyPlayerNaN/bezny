export type JsonValueDescriptor =
  | {
      kind: "array" | "object";
      label: string;
      children: { key: string; value: unknown }[];
    }
  | { kind: "leaf"; label: string };

export const jsonPointerChild = (path: string, key: string): string =>
  `${path}/${key.replaceAll("~", "~0").replaceAll("/", "~1")}`;

const dateText = (value: Date): string =>
  Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();

const functionText = (name: string): string =>
  `[Function ${name || "anonymous"}]`;

const primitiveText = (value: unknown): string | undefined => {
  switch (typeof value) {
    case "string": {
      return JSON.stringify(value);
    }
    case "number":
    case "boolean": {
      return String(value);
    }
    case "undefined": {
      return "undefined";
    }
    case "bigint": {
      return `${value}n`;
    }
    case "symbol": {
      return value.toString();
    }
    case "function": {
      return functionText(value.name);
    }
    default: {
      return value === null ? "null" : undefined;
    }
  }
};

const sanitizeValue = (
  value: unknown,
  ancestors: readonly object[]
): unknown => {
  if (value === undefined) {
    return "[undefined]";
  }
  if (typeof value === "bigint" || typeof value === "symbol") {
    return primitiveText(value);
  }
  if (typeof value === "function") {
    return functionText(value.name);
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }
  if (ancestors.includes(value)) {
    return "[Circular]";
  }
  if (value instanceof Date) {
    return dateText(value);
  }
  if (value instanceof RegExp) {
    return value.toString();
  }
  const next = [...ancestors, value];
  if (Array.isArray(value)) {
    return Array.from(value, (item: unknown) => sanitizeValue(item, next));
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]: [string, unknown]) => [
      key,
      sanitizeValue(child, next),
    ])
  );
};

const errorText = (error: unknown): string =>
  `Unable to inspect value: ${error instanceof Error ? error.message : "Unknown error"}`;

export const stringifyJsonValue = (value: unknown): string => {
  try {
    return JSON.stringify(sanitizeValue(value, []), null, 2) ?? "undefined";
  } catch (error) {
    return errorText(error);
  }
};

const describeObject = (
  value: object,
  ancestors: readonly object[]
): JsonValueDescriptor => {
  if (ancestors.includes(value)) {
    return { kind: "leaf", label: "[Circular]" };
  }
  if (value instanceof Date) {
    return { kind: "leaf", label: `Date(${dateText(value)})` };
  }
  if (value instanceof RegExp) {
    return { kind: "leaf", label: value.toString() };
  }
  if (Array.isArray(value)) {
    return {
      children: Array.from(value, (child: unknown, index) => ({
        key: String(index),
        value: child,
      })),
      kind: "array",
      label: `Array(${value.length})`,
    };
  }
  const entries = Object.entries(value) as [string, unknown][];
  const prototype: unknown = Object.getPrototypeOf(value);
  if (
    prototype !== Object.prototype &&
    prototype !== null &&
    entries.length === 0
  ) {
    return {
      kind: "leaf",
      label: `${value.constructor?.name ?? "Object"} ${stringifyJsonValue(value)}`,
    };
  }
  return {
    children: entries.map(([key, child]) => ({ key, value: child })),
    kind: "object",
    label: `Object(${entries.length})`,
  };
};

export const describeJsonValue = (
  value: unknown,
  ancestors: readonly object[]
): JsonValueDescriptor => {
  try {
    if (typeof value === "object" && value !== null) {
      return describeObject(value, ancestors);
    }
    return {
      kind: "leaf",
      label: primitiveText(value) ?? stringifyJsonValue(value),
    };
  } catch (error) {
    return { kind: "leaf", label: errorText(error) };
  }
};

export const expandableJsonPaths = (value: unknown): Set<string> => {
  const paths = new Set<string>();
  const pending: {
    value: unknown;
    path: string;
    ancestors: readonly object[];
  }[] = [{ ancestors: [], path: "", value }];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) {
      break;
    }
    const descriptor = describeJsonValue(current.value, current.ancestors);
    if (descriptor.kind === "leaf") {
      continue;
    }
    paths.add(current.path);
    const ancestors =
      typeof current.value === "object" && current.value !== null
        ? [...current.ancestors, current.value]
        : current.ancestors;
    for (const child of descriptor.children) {
      pending.push({
        ancestors,
        path: jsonPointerChild(current.path, child.key),
        value: child.value,
      });
    }
  }
  return paths;
};
