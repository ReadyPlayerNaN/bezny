/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- Validate shipped CSS and actual external dependency declarations. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const entry = new URL(import.meta.resolve("@bezny/base"));
const javascript = readFileSync(entry, "utf-8");
const css = readFileSync(
  new URL(import.meta.resolve("@bezny/base/style.css")),
  "utf-8"
);
const manifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf-8")
);

test("published scroll locking and Select viewport rules are in the external stylesheet", () => {
  assert.match(css, /overflow:hidden!important/u);
  assert.match(css, /overscroll-behavior:contain/u);
  assert.match(css, /scrollbar-gutter:stable/u);
  assert.match(css, /scrollbar-width:none/u);
  assert.match(css, /-ms-overflow-style:none/u);
  assert.match(css, /-webkit-overflow-scrolling:touch/u);
  assert.match(css, /::-webkit-scrollbar\{display:none\}/u);
  assert.ok(javascript.includes("data-bezny-scroll-locked"));
});

test("every emitted external package import is declared, including shared Radix contexts", () => {
  const imports = [
    ...javascript.matchAll(/(?:from|import)\s*["'](?<id>[^"']+)["']/gu),
  ];
  assert.ok(imports.length > 0);
  for (const match of imports) {
    const { id } = match.groups;
    if (!id.startsWith(".")) {
      const name = id.startsWith("@")
        ? id.split("/").slice(0, 2).join("/")
        : id.split("/")[0];
      assert.ok(
        manifest.dependencies[name] || manifest.peerDependencies[name],
        `Undeclared emitted dependency ${name}`
      );
    }
  }
});
