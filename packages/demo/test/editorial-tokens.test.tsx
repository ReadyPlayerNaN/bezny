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

  it("resolves compact shell dimensions through all four token layers", () => {
    const { css } = compileString(
      '@use "../../base/src/tokens"; @use "editorial-admin.module";',
      sassOptions
    );
    const values = new Map(
      [...css.matchAll(/(?<token>--bezny-[\w-]+):\s*(?<value>[^;]+);/gu)].map(
        (match) => [match.groups?.token, match.groups?.value?.trim()]
      )
    );
    const resolve = (name: string): string | undefined => {
      const value = values.get(name);
      const reference = value?.match(/^var\((?<token>--bezny-[\w-]+)\)$/u);
      return reference?.groups?.token ? resolve(reference.groups.token) : value;
    };
    expect(resolve("--bezny-control-editorial-demo-header-height")).toBe(
      "3rem"
    );
    expect(resolve("--bezny-control-editorial-demo-status-font-size")).toBe(
      "0.5rem"
    );
    expect(resolve("--bezny-control-editorial-demo-status-line-height")).toBe(
      "0.75rem"
    );
    expect(resolve("--bezny-control-editorial-demo-status-height")).toBe(
      "1.25rem"
    );
  });

  it("caps compact command results with an adjacent four-layer token chain", () => {
    const { css } = compileString(
      '@use "../../base/src/tokens"; @use "editorial-admin.module";',
      sassOptions
    );
    expect(css).toContain("--bezny-foundation-size-320: 20rem");
    expect(css).toContain(
      "--bezny-logical-command-list-max-height: var(--bezny-foundation-size-320)"
    );
    expect(css).toContain(
      "--bezny-structural-command-list-max-height: var(--bezny-logical-command-list-max-height)"
    );
    expect(css).toContain(
      "--bezny-control-editorial-demo-palette-list-max-height: var(--bezny-structural-command-list-max-height)"
    );
    expect(css).toContain(
      "max-height: min(50dvh, var(--bezny-control-editorial-demo-palette-list-max-height))"
    );
  });

  it("caps the banner, fixes the status bar, and reserves space for bottom controls", () => {
    const { css } = compile(path.resolve("src/editorial-admin.module.scss"));
    expect(css).toMatch(
      /\.application > header \{[^}]*max-height: var\(--bezny-control-editorial-demo-header-height\);[^}]*padding-block: 0;/u
    );
    expect(css).toMatch(/\.header \{[^}]*flex-wrap: nowrap;/u);
    expect(css).toMatch(
      /\.statusBar \{[^}]*position: fixed;[^}]*inset-block-end: 0;[^}]*font-size: var\(--bezny-control-editorial-demo-status-font-size\);/u
    );
    expect(css).toMatch(
      /\.application \{[^}]*padding-block-end: var\(--bezny-control-editorial-demo-status-height\);/u
    );
    expect(css).toContain(
      "inset-block-end: calc(var(--bezny-control-editorial-demo-status-height) + var(--bezny-control-editorial-demo-padding))"
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
