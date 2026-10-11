import { readFile } from "node:fs/promises";
import path from "node:path";

import { compile, compileString } from "sass";
import { describe, expect, it } from "vitest";

const options = { loadPaths: [path.resolve("src")] };
describe("package-owned admin chrome styles", () => {
  it("binds palette geometry through the existing four adjacent layers", () => {
    const { css } = compileString(
      '@use "../../base/src/tokens"; @use "admin-chrome.module";',
      options
    );
    expect(css).toContain("--bezny-foundation-size-320: 20rem");
    expect(css).toContain(
      "--bezny-logical-command-list-max-height: var(--bezny-foundation-size-320)"
    );
    expect(css).toContain(
      "--bezny-structural-command-list-max-height: var(--bezny-logical-command-list-max-height)"
    );
    expect(css).toContain(
      "--bezny-control-admin-chrome-palette-list-max-height: var(--bezny-structural-command-list-max-height)"
    );
    expect(css).toContain(
      "max-height: min(50dvh, var(--bezny-control-admin-chrome-palette-list-max-height))"
    );
  });

  it("keeps header tools on one line and every reference resolvable", async () => {
    const { css } = compile(path.resolve("src/admin-chrome.module.scss"));
    const base = await readFile(
      path.resolve("../base/dist/style.css"),
      "utf-8"
    );
    const declarations = new Set(
      [...`${base}\n${css}`.matchAll(/(?<token>--bezny-[\w-]+)\s*:/gu)].map(
        (match) => match.groups?.token
      )
    );
    const references = [...css.matchAll(/var\((?<token>--bezny-[\w-]+)/gu)].map(
      (match) => match.groups?.token
    );
    expect(
      references.every((reference) => declarations.has(reference))
    ).toBeTruthy();
    expect(css).toMatch(/\.header \{[^}]*flex-wrap: nowrap;/u);
    expect(css).toMatch(/\.headerTools \{[^}]*flex-wrap: nowrap;/u);
    expect(css).not.toMatch(/\d+px\b/u);
  });

  it("keeps accessors pure and rejects unknown aliases", () => {
    expect(compileString('@use "admin-chrome-appearance";', options).css).toBe(
      ""
    );
    expect(() =>
      compileString(
        '@use "admin-chrome-appearance" as a; .test{color:a.token("missing")}',
        options
      )
    ).toThrow("Unknown control-admin-chrome token");
  });
});
