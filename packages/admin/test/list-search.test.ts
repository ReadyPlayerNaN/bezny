import {
  defaultParseSearch,
  defaultStringifySearch,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import {
  adminListSearch,
  readAdminListSearch,
} from "../src/admin-list-search.js";

const entity = {
  filters: [
    { key: "search", label: "Search" },
    {
      key: "status",
      label: "Status",
      options: [{ label: "Draft", value: "draft" }],
    },
  ],
  pageSize: 2,
};

describe("collection URL query contract", () => {
  it("round-trips page, page size, and registered search/filter values without serializing locale", () => {
    const query = {
      filters: { search: "Žluťoučký + & /?", status: "draft" },
      locale: "cs",
      page: 3,
      pageSize: 7,
    };
    const search = adminListSearch(query, entity, {
      locale: "host-owned",
      tenant: "acme",
    });
    expect(search).toStrictEqual({
      filters: query.filters,
      locale: "host-owned",
      page: 3,
      pageSize: 7,
      tenant: "acme",
    });
    expect(
      readAdminListSearch(
        defaultParseSearch(defaultStringifySearch(search)),
        entity,
        100,
        "en"
      )
    ).toStrictEqual({
      ...query,
      locale: "en",
    });
  });

  it.each([
    null,
    [],
    { page: -2, pageSize: 0 },
    { page: "NaN", pageSize: 101 },
    { page: 1.5, pageSize: true },
    { page: Number.MAX_SAFE_INTEGER + 1, pageSize: [] },
  ])(
    "falls back safely for malformed or out-of-policy values: %j",
    (search) => {
      expect(readAdminListSearch(search, entity, 100, "en")).toStrictEqual({
        filters: {},
        locale: "en",
        page: 1,
        pageSize: 2,
      });
    }
  );

  it("drops unknown, overlong, non-string, inherited, and invalid enum filters", () => {
    const filters = Object.create({ search: "inherited" }) as Record<
      string,
      unknown
    >;
    filters.status = "published";
    filters.unknown = "discard";
    expect(
      readAdminListSearch({ filters }, entity, 100, "en").filters
    ).toStrictEqual({});
    expect(
      readAdminListSearch(
        { filters: { search: "x".repeat(201), status: ["draft"] } },
        entity,
        100,
        "en"
      ).filters
    ).toStrictEqual({});
    expect(
      readAdminListSearch(
        { filters: { search: "  valid  ", status: "draft" } },
        entity,
        100,
        "en"
      ).filters
    ).toStrictEqual({ search: "valid", status: "draft" });
  });

  it("removes default listing values while preserving unrelated host search keys", () => {
    expect(
      adminListSearch(
        { filters: {}, locale: "ar", page: 1, pageSize: 2 },
        entity,
        { filters: { search: "old" }, page: 99, pageSize: 50, tenant: "acme" }
      )
    ).toStrictEqual({ tenant: "acme" });
  });
});
