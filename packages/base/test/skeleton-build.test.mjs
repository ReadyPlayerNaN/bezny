/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- Verify the published build and compiled token contracts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { EntityRowListSkeleton, Skeleton } from "@bezny/base";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compileString } from "sass";

const css = readFileSync(
  new URL(import.meta.resolve("@bezny/base/style.css")),
  "utf-8"
);
const sourceDirectory = fileURLToPath(new URL("../src", import.meta.url));
const compile = (source) =>
  compileString(source, { loadPaths: [sourceDirectory] }).css;

test("published skeletons render without a provider or loading fake records", () => {
  const html = renderToStaticMarkup(
    createElement(EntityRowListSkeleton, { label: "Loading records", rows: 2 })
  );
  assert.ok(html.includes("<output"));
  assert.ok(html.includes("Loading records"));
  assert.equal(html.includes("checkbox"), false);
  assert.ok(
    renderToStaticMarkup(createElement(Skeleton)).includes('aria-hidden="true"')
  );
});

test("skeleton motion respects reduced motion and uses adjacent token layers", () => {
  assert.match(css, /prefers-reduced-motion:reduce[^}]*animation:none/u);
  assert.match(
    css,
    /--bezny-control-skeleton-duration:var\(--bezny-structural-skeleton-duration\)/u
  );
  assert.match(
    css,
    /--bezny-structural-skeleton-duration:var\(--bezny-logical-duration-placeholder\)/u
  );
  assert.match(
    css,
    /--bezny-logical-duration-placeholder:var\(--bezny-foundation-duration-pulse\)/u
  );
  assert.match(
    css,
    /--bezny-control-skeleton-background:var\(--bezny-structural-skeleton-background\)/u
  );
});

test("skeleton token imports are pure, emit locally, and reject unknown keys", () => {
  assert.equal(compile('@use "content/skeleton-appearance";'), "");
  assert.match(
    compile(
      '@use "content/skeleton-appearance"; .placeholder { @include skeleton-appearance.declarations; }'
    ),
    /\.placeholder\s*\{/u
  );
  assert.throws(
    () =>
      compile(
        '@use "content/skeleton-appearance"; .placeholder { color: skeleton-appearance.token("missing"); }'
      ),
    /Unknown/u
  );
});
