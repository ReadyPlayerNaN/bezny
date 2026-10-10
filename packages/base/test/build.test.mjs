/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- These are Node tests for the built ESM package. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  Button,
  Heading,
  HeadingLevelProvider,
  Main,
  Section,
  ToggleInput,
  useHeadingLevel,
} from "@bezny/base";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const css = readFileSync(
  new URL(import.meta.resolve("@bezny/base/style.css")),
  "utf-8"
);
const classPattern = /class="(?<classes>[^"]+)"/u;
const rulePattern = /\.(?<name>[\w-]+)\s*\{(?<body>[^}]+)\}/gu;
const rootPattern = /:root\s*\{(?<body>[^}]+)\}/gu;
const tokenPattern = /(?<name>--bezny-[\w-]+)\s*:\s*(?<value>[^;}]+)/gu;
const referencePattern = /^var\((?<name>--bezny-[\w-]+)\)$/u;
const tokenValueReferencePattern = /var\((?<name>--bezny-[\w-]+)\)/gu;
const derivedColorPattern =
  /^color-mix\(in srgb,\s*var\(--bezny-foundation-[\w-]+\) var\(--bezny-foundation-mix-weight-\d+\),\s*var\(--bezny-foundation-color-(?:black|white)\)\)$/u;
const cssReferencePattern = /var\((?<name>--bezny-[\w-]+)/gu;
const pixelPattern = /(?:\d*\.)?\d+px\b/u;
const layerPattern =
  /^--bezny-(?<layer>foundation|logical|structural|control)-/u;

const classNames = (level) => {
  const html = renderToStaticMarkup(createElement(Heading, { level }, "Title"));
  return html.match(classPattern).groups.classes.split(" ");
};

const rules = new Map();
for (const { groups } of css.matchAll(rulePattern)) {
  rules.set(groups.name, `${rules.get(groups.name) ?? ""}${groups.body};`);
}
const tokenEntries = (text) =>
  [...text.matchAll(tokenPattern)].map(({ groups }) => [
    groups.name,
    groups.value.trim(),
  ]);
const rootBlocks = [...css.matchAll(rootPattern)];
const rootTokens = Object.fromEntries(
  rootBlocks.flatMap(({ groups }) => tokenEntries(groups.body))
);

const resolveToken = (name, tokens, seen = new Set()) => {
  assert.ok(!seen.has(name), `Cyclic token: ${name}`);
  assert.ok(Object.hasOwn(tokens, name), `Missing token: ${name}`);
  seen.add(name);
  const value = tokens[name];
  const reference = value.match(referencePattern);
  if (reference) {
    return resolveToken(reference.groups.name, tokens, seen);
  }
  return value.replace(tokenValueReferencePattern, (_match, referenceName) =>
    resolveToken(referenceName, tokens, new Set(seen))
  );
};

const headingTokens = (level, overrides = {}) => {
  const [base, variant] = classNames(level);
  return {
    ...rootTokens,
    ...overrides,
    ...Object.fromEntries(tokenEntries(rules.get(base))),
    ...Object.fromEntries(tokenEntries(rules.get(variant))),
  };
};

test("package exports the complete heading API", () => {
  for (const component of [
    Heading,
    HeadingLevelProvider,
    Main,
    Section,
    useHeadingLevel,
  ]) {
    assert.equal(typeof component, "function");
  }
});

test("shared token defaults are emitted once and use adjacent layers only", () => {
  assert.equal(rootBlocks.length, 1);
  const expectedParents = {
    control: "structural",
    logical: "foundation",
    structural: "logical",
  };
  const declarations = tokenEntries(css);
  assert.ok(declarations.length > 0);
  for (const [name, value] of declarations) {
    const { layer } = name.match(layerPattern).groups;
    if (layer === "foundation") {
      assert.ok(!value.includes("var("), `${name} must be absolute`);
      if (name.startsWith("--bezny-foundation-size-")) {
        assert.ok(value.endsWith("rem"), `${name} must use rem`);
      }
    } else {
      const isDerivedColor =
        layer === "logical" &&
        name.startsWith("--bezny-logical-color-") &&
        derivedColorPattern.test(value);
      assert.ok(
        referencePattern.test(value) || isDerivedColor,
        `${name} must be an alias or a logical derived colour`
      );
      for (const { groups } of value.matchAll(tokenValueReferencePattern)) {
        assert.ok(
          groups.name.startsWith(`--bezny-${expectedParents[layer]}-`),
          `${name} skips a layer`
        );
        assert.ok(
          declarations.some(([declared]) => declared === groups.name),
          `${name} references a missing token`
        );
      }
    }
  }
  assert.doesNotMatch(css, pixelPattern);
});

test("every CSS variable reference in the built stylesheet has a declaration", () => {
  const definedTokens = new Set(tokenEntries(css).map(([name]) => name));
  const references = [...css.matchAll(cssReferencePattern)];
  assert.ok(references.length > 0);
  for (const { groups } of references) {
    assert.ok(
      definedTokens.has(groups.name),
      `Missing declaration for ${groups.name}`
    );
  }
});

test("built toggles bind scoped geometry and colour tokens through all four layers", () => {
  const html = renderToStaticMarkup(
    createElement(ToggleInput, { "aria-label": "Notifications" })
  );
  const [toggleClass] = html.match(classPattern).groups.classes.split(" ");
  const tokens = {
    ...rootTokens,
    ...Object.fromEntries(tokenEntries(rules.get(toggleClass))),
  };
  for (const [property, expected] of Object.entries({
    height: "1.5rem",
    inset: ".125rem",
    "thumb-size": "1.25rem",
    width: "2.5rem",
  })) {
    assert.equal(
      resolveToken(`--bezny-control-toggle-${property}`, tokens),
      expected
    );
  }
  assert.equal(
    resolveToken("--bezny-control-toggle-checked-background", tokens),
    "#007eb0"
  );
  assert.equal(
    resolveToken("--bezny-control-toggle-checked-background", {
      ...tokens,
      "--bezny-foundation-color-product-normal": "#8b5cf6",
    }),
    "#8b5cf6"
  );
  assert.ok(
    css.includes("inset-inline-start:"),
    "thumb placement supports RTL"
  );
  assert.ok(css.includes("prefers-reduced-motion"));
});

test("built heading styles resolve all six levels through the rem token chain", () => {
  const cases = [
    { font: "3rem", icon: "3rem", level: 1, line: "3.5rem" },
    { font: "2.5rem", icon: "2.5rem", level: 2, line: "3rem" },
    { font: "2rem", icon: "1.75rem", level: 3, line: "2.5rem" },
    { font: "1.5rem", icon: "1.5rem", level: 4, line: "2rem" },
    { font: "1.25rem", icon: "1.25rem", level: 5, line: "1.75rem" },
    { font: "1rem", icon: "1rem", level: 6, line: "1.5rem" },
  ];
  for (const { font, icon, level, line } of cases) {
    const [base, variant] = classNames(level);
    assert.notEqual(base, "heading", "base class must be scoped");
    assert.notEqual(
      variant,
      `heading--level-${level}`,
      "level class must be scoped"
    );
    const baseRule = rules.get(base);
    assert.ok(
      baseRule.includes("font-size:var(--bezny-control-heading-font-size)")
    );
    assert.ok(
      baseRule.includes("line-height:var(--bezny-control-heading-line-height)")
    );
    assert.ok(
      baseRule.includes("font-family:var(--bezny-control-heading-font-family)")
    );
    assert.ok(
      baseRule.includes("font-weight:var(--bezny-control-heading-font-weight)")
    );
    const tokens = headingTokens(level);
    assert.equal(
      resolveToken("--bezny-control-heading-font-size", tokens),
      font
    );
    assert.equal(
      resolveToken("--bezny-control-heading-line-height", tokens),
      line
    );
    assert.equal(
      resolveToken("--bezny-control-heading-icon-size", tokens),
      icon
    );
    assert.equal(
      resolveToken("--bezny-control-heading-font-family", tokens),
      "sans-serif"
    );
    assert.equal(
      resolveToken("--bezny-control-heading-font-weight", tokens),
      "700"
    );
  }
});

test("structural and foundational overrides propagate through heading aliases", () => {
  const structural = headingTokens(3, {
    "--bezny-structural-heading-3-font-size":
      "var(--bezny-logical-font-size-2xl)",
  });
  assert.equal(
    resolveToken("--bezny-control-heading-font-size", structural),
    "2rem"
  );
  const foundational = headingTokens(5, {
    "--bezny-foundation-size-20": "1.375rem",
  });
  assert.equal(
    resolveToken("--bezny-control-heading-font-size", foundational),
    "1.375rem"
  );
  assert.equal(
    resolveToken("--bezny-control-heading-icon-size", foundational),
    "1.375rem"
  );
});

test("interaction colours derive from foundational bases and follow root overrides", () => {
  for (const [palette, baseToken, baseColor] of [
    ["brand", "color-product-normal", "#007eb0"],
    ["neutral", "color-cloud-normal", "#e8edf1"],
    ["danger", "color-red-normal", "#df1111"],
  ]) {
    for (const [state, weight] of [
      ["hover", "90%"],
      ["active", "80%"],
    ]) {
      const name = `--bezny-logical-color-${palette}-${state}`;
      assert.match(rootTokens[name], derivedColorPattern);
      assert.equal(
        resolveToken(name, rootTokens),
        `color-mix(in srgb, ${baseColor} ${weight}, #000)`
      );
      assert.equal(
        resolveToken(name, {
          ...rootTokens,
          [`--bezny-foundation-${baseToken}`]: "#8040c0",
        }),
        `color-mix(in srgb, #8040c0 ${weight}, #000)`
      );
    }
  }
  assert.equal(
    resolveToken("--bezny-logical-color-brand-hover", {
      ...rootTokens,
      "--bezny-foundation-mix-weight-90": "95%",
    }),
    "color-mix(in srgb, #007eb0 95%, #000)"
  );
  for (const name of Object.keys(rootTokens)) {
    if (name.startsWith("--bezny-foundation-color-")) {
      assert.ok(!name.endsWith("-hover") && !name.endsWith("-active"), name);
    }
  }
  assert.ok(!Object.hasOwn(rootTokens, "--bezny-foundation-color-cloud-dark"));
});

test("built buttons resolve all variants and sizes through complete token chains", () => {
  const expectedBackgrounds = {
    critical: "#df1111",
    primary: "#007eb0",
    secondary: "#e8edf1",
  };
  for (const variant of ["primary", "secondary", "critical"]) {
    for (const size of ["normal", "small"]) {
      const html = renderToStaticMarkup(
        createElement(Button, { size, variant }, "Save")
      );
      const classes = html.match(classPattern).groups.classes.split(" ");
      const tokens = { ...rootTokens };
      for (const className of classes) {
        Object.assign(
          tokens,
          Object.fromEntries(tokenEntries(rules.get(className) ?? ""))
        );
      }
      assert.equal(
        resolveToken("--bezny-control-button-background", tokens),
        expectedBackgrounds[variant]
      );
      if (variant === "primary") {
        assert.equal(
          resolveToken("--bezny-control-button-background-hover", tokens),
          "color-mix(in srgb, #007eb0 90%, #000)"
        );
        assert.equal(
          resolveToken("--bezny-control-button-background-active", tokens),
          "color-mix(in srgb, #007eb0 80%, #000)"
        );
        assert.equal(
          resolveToken("--bezny-control-button-text", tokens),
          "#fff"
        );
      }
      assert.equal(
        resolveToken("--bezny-control-button-height", tokens),
        size === "small" ? "2rem" : "2.5rem"
      );
      assert.equal(
        resolveToken("--bezny-control-button-font-size", tokens),
        size === "small" ? ".75rem" : "1rem"
      );
      assert.equal(
        resolveToken("--bezny-control-button-line-height", tokens),
        size === "small" ? "1rem" : "1.25rem"
      );
      for (const name of Object.keys(tokens)) {
        if (name.startsWith("--bezny-control-button-")) {
          resolveToken(name, tokens);
        }
      }
    }
  }
});

test("icon sizing is scoped to graphics symbols inside headings", () => {
  const [base] = classNames(1);
  assert.ok(css.includes(`.${base} [role=graphics-symbol]`));
  assert.ok(css.includes("width:var(--bezny-control-heading-icon-size)"));
  assert.ok(css.includes("height:var(--bezny-control-heading-icon-size)"));
  assert.ok(css.includes("min-width:var(--bezny-control-heading-icon-size)"));
  assert.ok(css.includes("flex-shrink:0"));
  assert.ok(!css.includes("role=img"));
});
