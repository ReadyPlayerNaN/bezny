/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- Validate published popover exports and styling. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  Popover,
  PopoverTrigger,
  PopoverAnchor,
  PopoverContent,
  PopoverClose,
  PopoverArrow,
} from "@bezny/base";
import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("published popover parts preserve Radix composition and button semantics", () => {
  for (const component of [
    Popover,
    PopoverTrigger,
    PopoverAnchor,
    PopoverContent,
    PopoverClose,
    PopoverArrow,
  ]) {
    assert.ok(isValidElement(createElement(component)));
  }
  const html = renderToStaticMarkup(
    createElement(Popover, null, createElement(PopoverTrigger, null, "Details"))
  );
  assert.match(html, /type="button"/u);
  assert.match(html, /aria-haspopup="dialog"/u);
});
test("popover styling binds local control aliases to structural surfaces", () => {
  const css = readFileSync(
    new URL(import.meta.resolve("@bezny/base/style.css")),
    "utf-8"
  );
  assert.match(
    css,
    /--bezny-control-popover-background:\s*var\(--bezny-structural-surface-background\)/u
  );
  assert.match(
    css,
    /--bezny-control-popover-font-size:\s*var\(--bezny-structural-surface-font-size\)/u
  );
  assert.ok(css.includes("var(--radix-popover-content-available-width)"));
});
