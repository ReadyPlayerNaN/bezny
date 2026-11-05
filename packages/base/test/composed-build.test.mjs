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
  Table,
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
    Table,
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
test("modal primitives ship Radix behavior with the CSP adapter while shared interaction modules remain external", () => {
  const entry = new URL(import.meta.resolve("@bezny/base"));
  const javascript = readFileSync(entry, "utf-8");
  const sourceMap = JSON.parse(
    readFileSync(new URL("index.js.map", entry), "utf-8")
  );
  for (const primitive of [
    "toggle-group",
    "tooltip",
    "focus-scope",
    "dismissable-layer",
  ]) {
    assert.ok(
      javascript.includes(`from "@radix-ui/react-${primitive}"`),
      `Missing shared external ${primitive}`
    );
  }
  for (const primitive of [
    "select",
    "context-menu",
    "menu",
    "dropdown-menu",
    "dialog",
    "alert-dialog",
    "popover",
  ]) {
    assert.equal(
      javascript.includes(`from "@radix-ui/react-${primitive}"`),
      false,
      `Unadapted external ${primitive}`
    );
    assert.ok(
      sourceMap.sources.some((source) =>
        source.includes(`/@radix-ui/react-${primitive}/dist/`)
      ),
      `Missing original Radix ${primitive} behavior`
    );
  }
  assert.ok(
    sourceMap.sources.some((source) =>
      source.endsWith("src/layout/scroll-lock.tsx")
    )
  );
  assert.ok(javascript.includes("data-bezny-scroll-locked"));
});
