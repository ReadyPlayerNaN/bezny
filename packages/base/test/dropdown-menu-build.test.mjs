/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- Validate published dropdown composition and token bindings. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItemIndicator,
} from "@bezny/base";
import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("published dropdown parts support menu button composition", () => {
  for (const component of [
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuItemIndicator,
  ]) {
    assert.ok(isValidElement(createElement(component)));
  }
  const html = renderToStaticMarkup(
    createElement(
      DropdownMenu,
      null,
      createElement(DropdownMenuTrigger, null, "Actions")
    )
  );
  assert.match(html, /type="button"/u);
  assert.match(html, /aria-haspopup="menu"/u);
});
test("dropdown styling binds local surface tokens and keeps Radix external", () => {
  const css = readFileSync(
    new URL(import.meta.resolve("@bezny/base/style.css")),
    "utf-8"
  );
  const javascript = readFileSync(
    new URL(import.meta.resolve("@bezny/base")),
    "utf-8"
  );
  assert.match(
    css,
    /--bezny-control-dropdown-menu-background:\s*var\(--bezny-structural-surface-background\)/u
  );
  assert.match(
    css,
    /--bezny-control-dropdown-menu-font-size:\s*var\(--bezny-structural-surface-font-size\)/u
  );
  assert.ok(
    css.includes("var(--radix-dropdown-menu-content-available-height)")
  );
  assert.ok(javascript.includes('from "@radix-ui/react-dropdown-menu"'));
});
