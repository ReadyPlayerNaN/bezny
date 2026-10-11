import { readFile } from "node:fs/promises";
import path from "node:path";

import { compile, compileString } from "sass";
import { describe, expect, it } from "vitest";

const referencePattern = /var\((?<token>--bezny-[\w-]+)/gu;
const declarationPattern = /(?<token>--bezny-[\w-]+)\s*:/gu;
describe("admin collection styling", () => {
  it("lays out shared filter chips and integrated pagination using complete control tokens", async () => {
    const { css } = compile(path.resolve("src/admin-collection.module.scss"));
    const base = await readFile(
      path.resolve("../base/dist/style.css"),
      "utf-8"
    );
    const declarations = new Set(
      [...`${base}\n${css}`.matchAll(declarationPattern)].map(
        (match) => match.groups?.token
      )
    );
    const references = [...css.matchAll(referencePattern)].map(
      (match) => match.groups?.token
    );
    expect(references.length).toBeGreaterThan(0);
    expect(
      references.every((reference) => declarations.has(reference))
    ).toBeTruthy();
    expect(css).toContain(
      "--bezny-control-admin-collection-gap: var(--bezny-structural-surface-gap)"
    );
    expect(css).toMatch(/\.pagination \{[^}]*justify-content: space-between;/u);
    expect(css).toMatch(/\.filters,[\s\S]*?flex-wrap: wrap;/u);
  });

  it("keeps accessor imports pure and rejects unknown control keys", () => {
    const options = { loadPaths: [path.resolve("src")] };
    expect(
      compileString('@use "admin-collection-appearance";', options).css
    ).toBe("");
    expect(() =>
      compileString(
        '@use "admin-collection-appearance" as appearance; .test { gap: appearance.token("missing"); }',
        options
      )
    ).toThrow("Unknown control-admin-collection token");
  });
});
