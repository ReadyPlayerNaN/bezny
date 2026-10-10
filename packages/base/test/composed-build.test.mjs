/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- Validate published ESM components and their token-backed CSS. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  AlertDialog,
  Badge,
  Card,
  ContextMenu,
  Dialog,
  EntityRow,
  EntityRowTitle,
  Filters,
  Select,
  ToggleGroup,
  Tooltip,
  ValueFilter,
} from "@bezny/base";
import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const css = readFileSync(
  new URL(import.meta.resolve("@bezny/base/style.css")),
  "utf-8"
);
test("published entry exports every requested component family", () => {
  for (const component of [
    Select,
    ToggleGroup,
    Tooltip,
    ContextMenu,
    Dialog,
    AlertDialog,
    EntityRow,
    Card,
    Filters,
    Badge,
    ValueFilter,
  ]) {
    assert.ok(isValidElement(createElement(component)));
  }
});
test("standalone entity titles preserve semantic levels and independent title typography", () => {
  const html = renderToStaticMarkup(
    createElement(EntityRowTitle, { href: "/item", level: 3 }, "Item")
  );
  assert.ok(html.startsWith("<h3"));
  assert.match(
    css,
    /--bezny-control-entity-row-title-font-size:\s*var\(--bezny-structural-surface-row-title-font-size\)/u
  );
  assert.match(
    css,
    /--bezny-structural-surface-row-title-font-size:\s*var\(--bezny-logical-font-size-sm\)/u
  );
  assert.match(
    css,
    /\.[\w-]+\[data-variant\][^{]*\{[^}]*font-size:var\(--bezny-control-entity-row-title-font-size\)/u
  );
});
test("all required behavior primitives remain external to the published module", () => {
  const javascript = readFileSync(
    new URL(import.meta.resolve("@bezny/base")),
    "utf-8"
  );
  for (const primitive of [
    "select",
    "toggle-group",
    "tooltip",
    "context-menu",
    "dialog",
    "alert-dialog",
    "popover",
  ]) {
    assert.ok(
      javascript.includes(`from "@radix-ui/react-${primitive}"`),
      `Missing external ${primitive}`
    );
  }
});
