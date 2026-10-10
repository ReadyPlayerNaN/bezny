/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Node tests have no each API; validate Sass-backed status palette contrast. */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compileString } from "sass";

const propertyPattern = /(?<name>--bezny-[\w-]+):\s*(?<value>[^;]+);/gu;
const referencePattern = /^var\((?<name>--bezny-[\w-]+)\)$/u;
const parseColor = (value) => {
  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3) {
      hex = [...hex].map((digit) => digit.repeat(2)).join("");
    }
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
      1,
    ];
  }
  const [red, green, blue, alpha] = value
    .replaceAll(/^rgba?\(|\)$/gu, "")
    .split(/[\s,/]+/u);
  let opacity = 1;
  if (alpha) {
    opacity = alpha.endsWith("%")
      ? Number(alpha.slice(0, -1)) / 100
      : Number(alpha);
  }
  return [Number(red), Number(green), Number(blue), opacity];
};
const blend = ([red, green, blue, alpha], background) =>
  [red, green, blue].map(
    (channel, index) => channel * alpha + background[index] * (1 - alpha)
  );
const luminance = (color) => {
  const [red, green, blue] = color.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
};

for (const mode of ["light", "dark"]) {
  test(`all ${mode} badge tones meet WCAG AA for small text on their surface`, () => {
    const { css } = compileString(
      `@use "tokens/foundational"; @use "tokens/logical"; :root { @include foundational.declarations; @include logical.declarations(${mode}); }`,
      { loadPaths: [fileURLToPath(new URL("../src", import.meta.url))] }
    );
    const tokens = Object.fromEntries(
      [...css.matchAll(propertyPattern)].map(({ groups }) => [
        groups.name,
        groups.value.trim(),
      ])
    );
    const resolve = (name) => {
      const value = tokens[`--bezny-logical-${name}`] ?? tokens[name];
      assert.ok(value, `Missing palette token ${name}`);
      const reference = value.match(referencePattern);
      return reference ? resolve(reference.groups.name) : parseColor(value);
    };
    const surface = resolve("color-surface");
    for (const tone of ["neutral", "info", "success", "warning", "critical"]) {
      const text = resolve(
        tone === "neutral" ? "color-text-strong" : `badge-${tone}-text`
      );
      const background = blend(
        resolve(
          tone === "neutral" ? "color-neutral" : `badge-${tone}-background`
        ),
        surface
      );
      const textLuminance = luminance(blend(text, background));
      const backgroundLuminance = luminance(background);
      const contrast =
        (Math.max(textLuminance, backgroundLuminance) + 0.05) /
        (Math.min(textLuminance, backgroundLuminance) + 0.05);
      assert.ok(
        contrast >= 4.5,
        `${mode}/${tone} contrast ${contrast.toFixed(2)}`
      );
    }
  });
}
