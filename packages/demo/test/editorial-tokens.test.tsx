import { readFile } from "node:fs/promises";
import path from "node:path";

import { compile, compileString } from "sass";
import { describe, expect, it } from "vitest";

const referencePattern = /var\((?<token>--bezny-[\w-]+)/gu;
const declarationPattern = /(?<token>--bezny-[\w-]+)\s*:/gu;
const sassOptions = { loadPaths: [path.resolve("src")] };

describe("editorial demo tokens", () => {
  it("resolves all demo references through emitted base and control declarations", async () => {
    const { css } = compile(path.resolve("src/editorial-admin.module.scss"));
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
      "--bezny-control-editorial-demo-padding: var(--bezny-structural-surface-padding)"
    );
  });

  it("keeps reference imports pure and rejects misspelled control keys", () => {
    expect(compileString('@use "editorial-appearance";', sassOptions).css).toBe(
      ""
    );
    expect(() =>
      compileString(
        '@use "editorial-appearance" as appearance; .test { gap: appearance.token("missing"); }',
        sassOptions
      )
    ).toThrow("Unknown control-editorial-demo token");
  });
});
