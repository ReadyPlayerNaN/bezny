import { createStore } from "jotai";
import { describe, expect, it } from "vitest";

import {
  articlesAtom,
  describeArticleContext,
  resolveArticleContext,
} from "../src/article-state.js";

describe("article context", () => {
  it("uses stable entity references for direct list, create, detail, and edit URLs", () => {
    const articles = createStore().get(articlesAtom);
    expect([
      resolveArticleContext("/articles", articles, []),
      resolveArticleContext("/articles/create", articles, []),
      resolveArticleContext("/articles/1", articles, ["2"]),
      resolveArticleContext("/articles/1/edit", articles, ["2"]),
    ]).toStrictEqual([
      { entity: "articles", kind: "collection" },
      { entity: "articles", kind: "collection" },
      { entity: "articles", id: "1", kind: "entity" },
      { entity: "articles", id: "1", kind: "entity" },
    ]);
  });

  it("drops stale selections and refuses missing or unsupported entity URLs", () => {
    const articles = createStore().get(articlesAtom);
    expect(
      resolveArticleContext("/articles", articles, ["1", "deleted"])
    ).toStrictEqual({ entity: "articles", ids: ["1"], kind: "selection" });
    expect(
      resolveArticleContext("/articles", articles, ["deleted"])
    ).toStrictEqual({ entity: "articles", kind: "collection" });
    expect(
      [
        "/articles/999",
        "/other/1",
        "/articles/1/unknown",
        "/articles/1/edit/extra",
      ].map((pathname) =>
        describeArticleContext(resolveArticleContext(pathname, articles, []))
      )
    ).toStrictEqual(Array.from({ length: 4 }, () => "No available article"));
  });

  it("resolves trailing-slash URLs to the same context", () => {
    const articles = createStore().get(articlesAtom);
    expect(resolveArticleContext("/articles/", articles, [])).toStrictEqual({
      entity: "articles",
      kind: "collection",
    });
    expect(
      resolveArticleContext("/articles/1/edit/", articles, [])
    ).toStrictEqual({ entity: "articles", id: "1", kind: "entity" });
  });

  it("isolates in-memory workspaces and restores seeded data in a fresh store", () => {
    const first = createStore();
    const second = createStore();
    first.set(articlesAtom, []);
    expect(first.get(articlesAtom)).toStrictEqual([]);
    expect(second.get(articlesAtom)).toHaveLength(3);
  });
});
