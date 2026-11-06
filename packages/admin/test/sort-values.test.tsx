import { describe, expect, it } from "vitest";

import type {
  AdminSortingDefinition,
  AdminSortRule,
} from "../src/admin-data-adapter.js";
import {
  adminDataRequestKey,
  defaultAdminListQuery,
} from "../src/admin-data-session.js";
import {
  adminListSearch,
  readAdminListSearch,
} from "../src/admin-list-search.js";
import {
  readAdminSort,
  readAdminSortInput,
  validateAdminSorting,
} from "../src/admin-sort-model.js";

const sorting: AdminSortingDefinition = {
  default: [{ direction: "asc", key: "label" }],
  fields: [
    { key: "label", label: "Title" },
    { key: "all", label: "All" },
  ],
};
const entity = { pageSize: 25, sorting };
const defaults = [{ direction: "asc", key: "label" }];
const requestKey = (sort: readonly AdminSortRule[]) =>
  adminDataRequestKey({
    entity: "articles",
    query: { ...defaultAdminListQuery, sort },
    view: "list",
  });

describe("registered sort values", () => {
  it("keeps defaults distinct from explicit no-sort and canonicalizes default URLs", () => {
    expect(readAdminListSearch({}, entity, 100, "en").sort).toStrictEqual(
      defaults
    );
    expect(
      readAdminListSearch({ sort: [] }, entity, 100, "en").sort
    ).toStrictEqual([]);
    const query = readAdminListSearch({ sort: defaults }, entity, 100, "en");
    expect(
      adminListSearch(query, entity, { sort: defaults, tenant: "editorial" })
    ).toStrictEqual({ tenant: "editorial" });
    expect(adminListSearch({ ...query, sort: [] }, entity)).toStrictEqual({
      sort: [],
    });
  });

  it("does not change entities without sorting or their host search keys", () => {
    expect(readAdminListSearch({}, {}, 100, "en")).not.toHaveProperty("sort");
    expect(
      adminListSearch(defaultAdminListQuery, {}, { sort: "host-owned" })
    ).toStrictEqual({ sort: "host-owned" });
  });

  it.each([
    null,
    "label",
    {},
    [null],
    [{ direction: "asc", key: "missing" }],
    [{ direction: "sideways", key: "label" }],
    [
      { direction: "asc", key: "label" },
      { direction: "desc", key: "label" },
    ],
    Array.from({ length: 51 }, () => ({ direction: "asc", key: "label" })),
  ])(
    "rejects invalid rules and safely falls back for URL input: %j",
    (value) => {
      expect(readAdminSort(value, sorting)).toBeNull();
      expect(
        readAdminListSearch({ sort: value }, entity, 100, "en").sort
      ).toStrictEqual(defaults);
    }
  );

  it("bounds command parsing and preserves opaque keys and priority", () => {
    const value = [
      { direction: "desc", key: "all" },
      { direction: "asc", key: "label" },
    ];
    expect(readAdminSortInput(JSON.stringify(value), sorting)).toStrictEqual(
      value
    );
    expect(readAdminSortInput("{", sorting)).toBeNull();
    expect(readAdminSortInput(" ".repeat(100_000), sorting)).toBeNull();
  });

  it("owns immutable normalized rules", () => {
    const rule = { direction: "desc", key: "all" };
    const canonical = readAdminSort([rule], sorting);
    rule.key = "changed";
    expect(canonical?.[0]?.key).toBe("all");
    expect(Object.isFrozen(canonical)).toBeTruthy();
    expect(Object.isFrozen(canonical?.[0])).toBeTruthy();
  });

  it("distinguishes sort direction and priority in cache identity but not object property order", () => {
    const rules = [
      { direction: "asc", key: "label" },
      { direction: "desc", key: "all" },
    ] as const;
    expect(requestKey(rules)).not.toBe(requestKey(rules.toReversed()));
    expect(requestKey(rules)).not.toBe(
      requestKey([{ direction: "desc", key: "label" }, rules[1]])
    );
    expect(requestKey(rules)).toBe(
      requestKey(rules.map(({ key, ...rest }) => ({ key, ...rest })))
    );
  });

  it("rejects invalid registrations and defaults", () => {
    expect(() => validateAdminSorting(sorting)).not.toThrow();
    for (const invalid of [
      { fields: [] },
      { fields: [{ key: "", label: "Empty" }] },
      { fields: [{ key: "x".repeat(201), label: "Long" }] },
      { fields: [{ key: "label", label: "" }] },
      { fields: [{ key: "label", label: "x".repeat(1001) }] },
      { fields: [...sorting.fields, { key: "label", label: "Duplicate" }] },
      {
        fields: Array.from({ length: 51 }, (_, index) => ({
          key: `field-${index}`,
          label: "Field",
        })),
      },
      { ...sorting, default: [{ direction: "asc" as const, key: "missing" }] },
    ]) {
      expect(() => validateAdminSorting(invalid)).toThrow(/sorting/iu);
    }
  });
});
