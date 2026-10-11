/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- Validate published toast exports and CSS. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ToastProvider,
  Toast,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
} from "@bezny/base";
import { createElement, isValidElement } from "react";
import * as sass from "sass";

test("published toast parts are available", () => {
  for (const component of [
    ToastProvider,
    Toast,
    ToastViewport,
    ToastTitle,
    ToastDescription,
    ToastAction,
    ToastClose,
  ]) {
    assert.ok(isValidElement(createElement(component)));
  }
});

test("toast CSS binds local surface tokens and preserves swipe positioning", () => {
  const css = readFileSync(
    new URL(import.meta.resolve("@bezny/base/style.css")),
    "utf-8"
  );
  for (const name of [
    "background",
    "font-size",
    "line-height",
    "width",
    "focus-ring",
  ]) {
    assert.ok(
      css.includes(
        `--bezny-control-toast-${name}:var(--bezny-structural-surface-${name})`
      )
    );
  }
  assert.ok(css.includes("var(--radix-toast-swipe-move-x)"));
  assert.ok(css.includes("var(--radix-toast-swipe-move-y)"));
  assert.ok(css.includes("max-height:100dvh"));
});

test("toast token imports are pure, scoped declarations emit, and unknown keys fail", () => {
  const loadPaths = [new URL("../src", import.meta.url).pathname];
  const result = sass.compileString(
    '@use "controls/toast-appearance" as appearance;',
    { loadPaths }
  );
  assert.equal(result.css, "");
  const scoped = sass.compileString(
    '@use "controls/toast-appearance" as appearance; .notification { @include appearance.declarations; color: appearance.token("text"); }',
    { loadPaths }
  );
  assert.match(scoped.css, /\.notification\s*\{/u);
  assert.ok(scoped.css.includes("var(--bezny-control-toast-text)"));
  assert.throws(() =>
    sass.compileString(
      '@use "controls/toast-appearance" as appearance; .notification { color: appearance.token("unknown"); }',
      { loadPaths }
    )
  );
});
