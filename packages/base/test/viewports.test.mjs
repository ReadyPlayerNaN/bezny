/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- Verify Sass's build-time query API. */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compileString, NodePackageImporter } from "sass";

const options = {
  loadPaths: [fileURLToPath(new URL("../src", import.meta.url))],
};
test("viewport imports are pure and queries resolve to literal widths, never var()", () => {
  assert.equal(compileString('@use "tokens/viewports";', options).css, "");
  const { css } = compileString(
    '@use "tokens/viewports"; @include viewports.below(compact) { .tiny { display: block; } } @include viewports.at-least(wide) { .wide { display: block; } }',
    options
  );
  assert.ok(css.includes("@media (width < 40rem)"));
  assert.ok(css.includes("@media (width >= 64rem)"));
  assert.ok(!css.includes("var("));
});
test("viewport aliases preserve adjacent foundational, logical and structural layers", () => {
  const { css } = compileString('@use "tokens";', options);
  for (const [name, width] of [
    ["compact", "40rem"],
    ["wide", "64rem"],
  ]) {
    assert.ok(
      css.includes(`--bezny-foundation-viewport-width-${name}: ${width}`)
    );
    assert.ok(
      css.includes(
        `--bezny-logical-viewport-${name}-min-width: var(--bezny-foundation-viewport-width-${name})`
      )
    );
    assert.ok(
      css.includes(
        `--bezny-structural-viewport-${name}-min-width: var(--bezny-logical-viewport-${name}-min-width)`
      )
    );
  }
});
test("unknown viewport names fail compilation", () => {
  assert.throws(
    () =>
      compileString(
        '@use "tokens/viewports"; @include viewports.at-least(huge) { .test { display: block; } }',
        options
      ),
    /Unknown structural viewport/u
  );
});
test("the public Sass package export resolves without private source imports", () => {
  const { css } = compileString(
    '@use "pkg:@bezny/base/viewports"; @include viewports.at-least(compact) { .test { display: block; } }',
    {
      importers: [
        new NodePackageImporter(
          fileURLToPath(new URL("../../demo", import.meta.url))
        ),
      ],
    }
  );
  assert.ok(css.includes("@media (width >= 40rem)"));
});
