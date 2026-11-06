import { describe, expect, it } from "vitest";

import type {
  AdminFilterReference,
  AdminFilterDefinition,
} from "../src/admin-data-adapter.js";
import { normalizeAdminFilterValue } from "../src/admin-filter-values.js";
import {
  validateAdminFilterReferences,
  validateAdminReferenceRegistration,
} from "../src/admin-reference-filter-model.js";

const reference = {
  resolve: () => Promise.resolve([]),
  search: () => Promise.resolve([]),
};

describe("reference filter boundaries", () => {
  it.each([
    null,
    {},
    [{ label: "Empty", value: "" }],
    [{ label: "Long ID", value: "x".repeat(201) }],
    [{ label: "x".repeat(1001), value: "a" }],
    [
      { label: "A", value: "a" },
      { label: "Duplicate", value: "a" },
    ],
    Array.from({ length: 21 }, (_, index) => ({
      label: String(index),
      value: String(index),
    })),
  ])("rejects malformed and unbounded callback output %j", (result) => {
    expect(() =>
      validateAdminFilterReferences(
        result as readonly AdminFilterReference[],
        20
      )
    ).toThrow("Invalid reference filter result");
  });

  it("rejects resolution IDs not requested but permits missing references", () => {
    expect(() =>
      validateAdminFilterReferences([{ label: "Other", value: "other" }], 1, [
        "wanted",
      ])
    ).toThrow("Invalid reference filter result");
    expect(validateAdminFilterReferences([], 1, ["wanted"])).toStrictEqual([]);
  });

  it("preserves scalar and multi-value opaque IDs without treating labels as authority", () => {
    const filter = { key: "category", label: "Category", reference };
    expect(normalizeAdminFilterValue(filter, " a/b ~ ")).toBe(" a/b ~ ");
    expect(
      normalizeAdminFilterValue(
        { ...filter, multiple: true },
        '["unknown","a/b~"]'
      )
    ).toBe('["unknown","a/b~"]');
    expect(normalizeAdminFilterValue(filter, "x".repeat(201))).toBeNull();
    expect(
      normalizeAdminFilterValue(
        { ...filter, multiple: true },
        '["duplicate","duplicate"]'
      )
    ).toBeNull();
  });

  it.each([null, {}, { search: () => Promise.resolve([]) }])(
    "rejects invalid reference registration %j",
    (source) => {
      expect(() =>
        validateAdminReferenceRegistration({
          key: "category",
          label: "Category",
          reference: source,
        } as unknown as AdminFilterDefinition)
      ).toThrow("Invalid reference filter");
    }
  );

  it("rejects conflicting static and dynamic sources", () => {
    expect(() =>
      validateAdminReferenceRegistration({
        key: "category",
        label: "Category",
        options: [],
        reference,
      })
    ).toThrow("Invalid reference filter");
  });
});
