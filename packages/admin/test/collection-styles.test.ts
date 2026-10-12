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

  it("removes browser definition-list spacing and wraps compact metadata without overflow", () => {
    const { css } = compile(path.resolve("src/admin-collection.module.scss"));
    expect(css).toMatch(
      /\.recordSummary \{[^}]*display: flex;[^}]*flex-wrap: wrap;[^}]*margin: 0;/u
    );
    expect(css).toMatch(
      /\.recordSummary dd \{[^}]*margin: 0;[^}]*overflow-wrap: anywhere;/u
    );
    expect(css).toContain(
      "--bezny-control-admin-collection-muted: var(--bezny-structural-surface-muted)"
    );
  });

  it("restores a compact fixed bottom-center selection bar with complete control references", async () => {
    const { css } = compile(path.resolve("src/admin-selection.module.scss"));
    const base = await readFile(
      path.resolve("../base/dist/style.css"),
      "utf-8"
    );
    const declarations = new Set(
      [...`${base}\n${css}`.matchAll(declarationPattern)].map(
        (match) => match.groups?.token
      )
    );
    expect(
      [...css.matchAll(referencePattern)].every((match) =>
        declarations.has(match.groups?.token)
      )
    ).toBeTruthy();
    expect(css).toMatch(/position: fixed;/u);
    expect(css).toMatch(/left: 50%;/u);
    expect(css).toMatch(/transform: translateX\(-50%\);/u);
    expect(css).not.toMatch(/width: 100%;/u);
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
