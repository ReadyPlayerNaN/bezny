/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- These are Node tests of Sass compilation. */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compileString } from "sass";

const sourceDirectory = fileURLToPath(new URL("../src", import.meta.url));
const compileTokenStyles = (source) =>
  compileString(source, { loadPaths: [sourceDirectory] }).css;
const runtimeReferencePattern =
  /font-size: var\(--bezny-control-heading-font-size\)/u;
const scopedDeclarationPattern = /\.theme \{\s*--bezny-example-size: 1rem;/u;
const exampleReferencePattern = /font-size: var\(--bezny-example-size\)/u;
const declarationFailurePattern = /Missing value for example token: size/u;
const missingExportPattern = /Undefined variable/u;
const handwrittenReferencePattern = /var\(--bezny-/u;

// References are values, not registration calls: imports alone must emit no CSS.
test("importing token reference modules does not emit declarations", () => {
  const compiled = compileTokenStyles(`
    @use "tokens/foundational";
    @use "tokens/logical";
    @use "tokens/structural";
    @use "content/heading-typography";
  `);
  assert.equal(compiled, "");
});

test("exported Sass variables preserve runtime CSS references", () => {
  const compiled = compileTokenStyles(`
    @use "content/heading-typography";
    .heading { font-size: heading-typography.$font-size; }
  `);
  assert.match(compiled, runtimeReferencePattern);
  assert.ok(!compiled.includes("--bezny-control-heading-font-size:"));
});

test("unknown scale keys and heading levels fail Sass compilation", () => {
  const invalidReferences = [
    {
      errorPattern: /Unknown foundation token: size-99/u,
      expression: "foundational.size(99)",
      module: "tokens/foundational",
    },
    {
      errorPattern: /Unknown logical token: font-size-missing/u,
      expression: 'logical.font-size("missing")',
      module: "tokens/logical",
    },
    {
      errorPattern: /Unknown logical token: line-height-missing/u,
      expression: 'logical.line-height("missing")',
      module: "tokens/logical",
    },
    {
      errorPattern: /Unknown logical token: icon-size-missing/u,
      expression: 'logical.icon-size("missing")',
      module: "tokens/logical",
    },
    {
      errorPattern: /Unknown structural token: heading-7-font-size/u,
      expression: "structural.heading-font-size(7)",
      module: "tokens/structural",
    },
  ];
  for (const { errorPattern, expression, module } of invalidReferences) {
    assert.throws(
      () =>
        compileTokenStyles(
          `@use "${module}"; .heading { font-size: ${expression}; }`
        ),
      errorPattern
    );
  }
});

test("misspelled Sass exports fail compilation", () => {
  assert.throws(
    () =>
      compileTokenStyles(
        `@use "content/heading-typography"; .heading { font-size: heading-typography.$missing-font-size; }`
      ),
    missingExportPattern
  );
});

test("declaration mixins emit in the caller's scope", () => {
  const compiled = compileTokenStyles(`
    @use "tokens/css-properties";
    $definitions: ("size": 1rem);
    .theme { @include css-properties.declarations($definitions, "example"); }
    .heading { font-size: css-properties.reference($definitions, "size", "example"); }
  `);
  assert.match(compiled, scopedDeclarationPattern);
  assert.match(compiled, exampleReferencePattern);
  assert.ok(!compiled.includes(":root"));
});

test("SCSS source does not handwrite Bezny CSS variable references", () => {
  for (const filename of readdirSync(sourceDirectory, { recursive: true })) {
    if (filename.endsWith(".scss")) {
      const source = readFileSync(
        new URL(`../src/${filename}`, import.meta.url),
        "utf-8"
      );
      assert.doesNotMatch(source, handwrittenReferencePattern, filename);
    }
  }
});

test("declaration mixins reject missing values", () => {
  assert.throws(
    () =>
      compileTokenStyles(
        `@use "tokens/css-properties"; .theme { @include css-properties.declarations(("size": null), "example"); }`
      ),
    declarationFailurePattern
  );
});
