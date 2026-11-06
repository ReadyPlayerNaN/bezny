import { describe, expect, it } from "vitest";

import {
  defineAdminEntity,
  decodeAdminFilterSelection,
  encodeAdminFilterSelection,
} from "../src/admin-data-adapter.js";
import { createAdminEntityRegistry } from "../src/admin-entity-model.js";
import {
  adminListSearch,
  readAdminListSearch,
} from "../src/admin-list-search.js";

const categories = {
  key: "category",
  label: "Category",
  multiple: true,
  options: [
    { label: "News", value: "news" },
    { label: "Guides", value: "guides" },
  ],
};
const entity = {
  filters: [categories, { key: "search", label: "Search" }],
  pageSize: 25,
};
const read = (value: unknown) =>
  readAdminListSearch({ filters: { category: value } }, entity, 100, "en");

describe("registered selection wire values", () => {
  it("round-trips multiple values through the existing string-valued URL contract", () => {
    const value = encodeAdminFilterSelection(["news", "guides"]);
    const query = read(value);
    expect(query.filters).toStrictEqual({ category: '["news","guides"]' });
    expect(
      decodeAdminFilterSelection(query.filters.category ?? "")
    ).toStrictEqual(["news", "guides"]);
    expect(
      readAdminListSearch(
        adminListSearch(query, entity, { tenant: "editorial" }),
        entity,
        100,
        "en"
      )
    ).toStrictEqual(query);
    expect(
      adminListSearch(query, entity, { tenant: "editorial" })
    ).toHaveProperty("tenant", "editorial");
  });

  it.each([
    null,
    ["news"],
    "news",
    "{}",
    '["missing"]',
    '["news","news"]',
    "[1]",
    '[""]',
    "[",
  ])("rejects malformed or unknown selection %j", (value) => {
    expect(read(value).filters).toStrictEqual({});
  });

  it("treats empty arrays and empty strings as clearing and preserves scalar normalization", () => {
    expect(read("[]").filters).toStrictEqual({});
    expect(read("").filters).toStrictEqual({});
    expect(encodeAdminFilterSelection([])).toBe("");
    expect(
      readAdminListSearch(
        { filters: { search: "  editorial  " } },
        entity,
        100,
        "en"
      ).filters
    ).toStrictEqual({ search: "editorial" });
  });

  it("bounds selection count, value length, duplicates and escaped opaque IDs", () => {
    expect(() =>
      encodeAdminFilterSelection(
        Array.from({ length: 51 }, (_, i) => String(i))
      )
    ).toThrow("Invalid filter selection");
    expect(() => encodeAdminFilterSelection(["x".repeat(201)])).toThrow(
      "Invalid filter selection"
    );
    expect(() => decodeAdminFilterSelection(" ".repeat(100_000))).toThrow(
      "Invalid filter selection"
    );
    const values = ['comma,quote"', "a/b~c", "عربي"];
    expect(
      decodeAdminFilterSelection(encodeAdminFilterSelection(values))
    ).toStrictEqual(values);
  });

  it("rejects multi-choice registrations without options", () => {
    const definition = defineAdminEntity({
      adapter: {
        get: () => Promise.resolve(null),
        list: () => Promise.resolve({ items: [], total: 0 }),
      },
      filters: [{ key: "category", label: "Category", multiple: true }],
      key: "articles",
      label: "Articles",
      parseValues: (value: unknown) => value,
      reference: () => ({ id: "article", label: "Article" }),
      singularLabel: "Article",
    });
    expect(() => createAdminEntityRegistry([definition])).toThrow(
      "requires options"
    );
    expect(() =>
      createAdminEntityRegistry([{ ...definition, filters: [categories] }])
    ).not.toThrow();
  });
});
