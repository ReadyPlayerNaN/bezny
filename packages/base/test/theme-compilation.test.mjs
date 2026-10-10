/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Node's test runner does not provide Vitest's parameterized API. */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compileString } from "sass";

const sourceDirectory = fileURLToPath(new URL("../src", import.meta.url));
const compileTheme = (source) =>
  compileString(source, { loadPaths: [sourceDirectory] }).css;
const declarationPattern = /(?<name>--bezny-[\w-]+):\s*(?<value>[^;]+);/gu;
const referencesPattern = /var\((?<name>--bezny-[\w-]+)\)/gu;
const unknownModePattern = /Unknown colour mode: sepia/u;

for (const mode of ["light", "dark"]) {
  test(`${mode} theme declarations resolve every reference within their boundary`, () => {
    const css = compileTheme(`
      @use "tokens/foundational";
      @use "tokens/logical";
      @use "tokens/structural";
      @use "theme/theme-appearance";
      .boundary {
        @include foundational.declarations;
        @include logical.declarations(${mode});
        @include structural.declarations;
        @include theme-appearance.declarations;
        @include theme-appearance.appearance;
      }
    `);
    const declarations = new Map(
      [...css.matchAll(declarationPattern)].map(({ groups }) => [
        groups.name,
        groups.value.trim(),
      ])
    );
    assert.ok(declarations.size > 0);
    for (const { groups } of css.matchAll(referencesPattern)) {
      assert.ok(
        declarations.has(groups.name),
        `Missing ${mode} reference: ${groups.name}`
      );
    }
    assert.equal(
      declarations.get("--bezny-logical-color-surface"),
      `var(--bezny-foundation-color-${mode === "dark" ? "ink-normal" : "white"})`
    );
    assert.equal(
      declarations.get("--bezny-logical-color-danger-text"),
      mode === "dark"
        ? "var(--bezny-foundation-color-red-light)"
        : "color-mix(in srgb, var(--bezny-foundation-color-red-normal) var(--bezny-foundation-mix-weight-80), var(--bezny-foundation-color-black))"
    );
    assert.ok(!css.includes(":root"));
  });
}

test("theme modes are validated and pure imports emit nothing", () => {
  assert.throws(
    () =>
      compileTheme(
        '@use "tokens/logical"; .boundary { @include logical.declarations(sepia); }'
      ),
    unknownModePattern
  );
  assert.equal(compileTheme('@use "theme/theme-appearance";'), "");
});
