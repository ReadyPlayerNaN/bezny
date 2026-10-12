import { readFile } from "node:fs/promises";
import path from "node:path";

import { compile, compileString } from "sass";
import { describe, expect, it } from "vitest";

const options = { loadPaths: [path.resolve("src")] };

describe("letter-hint overlay styles", () => {
  it("binds control tokens only to structural tokens, with no unresolved references", async () => {
    const { css } = compile(path.resolve("src/admin-navigation.module.scss"));
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
    expect(
      [
        ...css.matchAll(
          /--bezny-control-admin-navigation-[\w-]+:\s*var\((?<target>[^)]+)\)/gu
        ),
      ].every((match) =>
        match.groups?.target?.startsWith("--bezny-structural-")
      )
    ).toBeTruthy();
    expect(css).not.toMatch(/\d+px\b/u);
  });

  it("keeps the overlay noninteractive and cached badges independently hideable", () => {
    const { css } = compile(path.resolve("src/admin-navigation.module.scss"));
    expect(css).toMatch(/\.overlay \{[^}]*pointer-events: none;/u);
    expect(css).toMatch(/\.overlay::backdrop \{[^}]*pointer-events: none;/u);
    expect(css).toMatch(/\.badge\[hidden\] \{\s*display: none;/u);
    expect(css).toContain(
      "font-size: var(--bezny-control-admin-navigation-font-size)"
    );
  });

  it("keeps accessors pure and rejects unknown tokens", () => {
    expect(
      compileString('@use "admin-navigation-appearance";', options).css
    ).toBe("");
    expect(() =>
      compileString(
        '@use "admin-navigation-appearance" as a; .test{color:a.token("missing")}',
        options
      )
    ).toThrow("Unknown control-admin-navigation token");
  });
});
