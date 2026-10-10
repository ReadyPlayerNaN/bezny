/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- These are Node tests of Sass compilation. */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compileString } from "sass";

const loadPaths = [fileURLToPath(new URL("../src", import.meta.url))];
const { css } = compileString('@use "tokens"; @use "filters/filter.module";', {
  loadPaths,
});
const declarationPattern = /(?<name>--bezny-[\w-]+):\s*(?<value>[^;]+);/gu;
const aliasPattern = /^var\((?<name>--bezny-[\w-]+)\)$/u;
const declarations = Object.fromEntries(
  [...css.matchAll(declarationPattern)].map(({ groups }) => [
    groups.name,
    groups.value.trim(),
  ])
);
const resolve = (name) => {
  const value = declarations[name];
  assert.ok(value, `Missing token: ${name}`);
  const alias = value.match(aliasPattern);
  return alias ? resolve(alias.groups.name) : value;
};

test("filter buttons use full-height pill radii and smaller padding without changing panels", () => {
  assert.equal(resolve("--bezny-control-filter-button-radius"), "2.5rem");
  assert.equal(resolve("--bezny-control-filter-height"), "2.5rem");
  assert.equal(resolve("--bezny-control-filter-button-padding"), "0.5rem");
  assert.equal(resolve("--bezny-control-filter-padding"), "1rem");
  assert.equal(resolve("--bezny-control-filter-radius"), "0.375rem");
  const badge = css.match(/\.badge \{(?<body>[^}]+)\}/u)?.groups.body;
  assert.ok(badge);
  assert.match(badge, /box-sizing: border-box/u);
  assert.match(badge, /padding-block: 0/u);
  assert.match(
    badge,
    /padding-inline: var\(--bezny-control-filter-button-padding\)/u
  );
  assert.match(
    badge,
    /border-radius: var\(--bezny-control-filter-button-radius\)/u
  );
});

test("filter button control tokens reference structural purposes and validate their keys", () => {
  assert.equal(
    declarations["--bezny-control-filter-button-radius"],
    "var(--bezny-structural-filter-button-radius)"
  );
  assert.equal(
    declarations["--bezny-structural-filter-button-radius"],
    "var(--bezny-logical-control-height-normal)"
  );
  assert.equal(
    declarations["--bezny-control-filter-button-padding"],
    "var(--bezny-structural-filter-button-padding)"
  );
  assert.equal(
    declarations["--bezny-structural-filter-button-padding"],
    "var(--bezny-logical-spacing-small)"
  );
  assert.throws(
    () =>
      compileString(
        '@use "filters/filter-appearance"; .filter { padding: filter-appearance.token("unknown"); }',
        { loadPaths }
      ),
    /Unknown control-filter token: unknown/u
  );
});
