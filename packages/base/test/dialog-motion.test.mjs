/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Node's test runner does not provide Vitest's parameterized API. */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compileString } from "sass";

const sourceDirectory = fileURLToPath(new URL("../src", import.meta.url));
const { css } = compileString('@use "tokens"; @use "controls/dialog.module";', {
  loadPaths: [sourceDirectory],
});
const declarations = new Map(
  [...css.matchAll(/(?<name>--bezny-[\w-]+):\s*(?<value>[^;]+);/gu)].map(
    ({ groups }) => [groups.name, groups.value.trim()]
  )
);

for (const [control, logical, foundation, value] of [
  ["duration-enter", "duration-modal-enter", "duration-modal", "200ms"],
  ["duration-exit", "duration-modal-exit", "duration-interaction", "120ms"],
  ["easing-enter", "easing-enter", "easing-enter", "ease-out"],
  ["easing-exit", "easing-exit", "easing-exit", "ease-in"],
  ["scale-hidden", "scale-modal-hidden", "scale-subtle", "0.96"],
  ["backdrop-blur", "blur-backdrop", "size-8", "0.5rem"],
]) {
  test(`dialog ${control} follows the adjacent four-layer token chain`, () => {
    assert.equal(
      declarations.get(`--bezny-control-dialog-${control}`),
      `var(--bezny-structural-dialog-${control})`
    );
    assert.equal(
      declarations.get(`--bezny-structural-dialog-${control}`),
      `var(--bezny-logical-${logical})`
    );
    assert.equal(
      declarations.get(`--bezny-logical-${logical}`),
      `var(--bezny-foundation-${foundation})`
    );
    assert.equal(declarations.get(`--bezny-foundation-${foundation}`), value);
  });
}

test("panels and backdrops animate both Radix states without overriding placement transforms", () => {
  for (const name of [
    "dialog-enter",
    "dialog-exit",
    "backdrop-enter",
    "backdrop-exit",
  ]) {
    assert.ok(css.includes(`animation: ${name} `));
    assert.ok(css.includes(`@keyframes ${name}`));
  }
  const keyframes = css.slice(
    css.indexOf("@keyframes backdrop-enter"),
    css.indexOf("@media (prefers-reduced-motion: reduce)")
  );
  assert.match(keyframes, /scale: var\(--bezny-control-dialog-scale-hidden\)/u);
  assert.doesNotMatch(keyframes, /transform:/u);
  assert.ok(
    css.includes(
      "backdrop-filter: blur(var(--bezny-control-dialog-backdrop-blur))"
    )
  );
});

test("reduced motion removes animations and closed layers cannot intercept pointer events", () => {
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[^]*?animation: none;/u
  );
  assert.match(
    css,
    /\.overlay\[data-state=closed\]\s*\{[^}]*pointer-events: none;/u
  );
  assert.match(
    css,
    /\.content\[data-state=closed\]\s*\{[^}]*pointer-events: none;/u
  );
});
