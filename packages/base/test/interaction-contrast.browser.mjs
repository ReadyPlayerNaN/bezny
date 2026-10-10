/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- Exercise actual browser colour mixing and component interaction surfaces. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { Badge, Button, EntityRowList } from "@bezny/base";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const tones = ["neutral", "info", "success", "warning", "critical"];
const stylesheet = readFileSync(
  new URL(import.meta.resolve("@bezny/base/style.css")),
  "utf-8"
);
const content = renderToStaticMarkup(
  createElement(
    "main",
    null,
    createElement(EntityRowList, {
      rows: tones.map((tone) => ({
        actions: [
          {
            key: "archive",
            label: "Archive",
            onSelect: () => {
              throw new Error("Static contrast fixture actions must not run");
            },
          },
        ],
        badge: createElement(Badge, { type: tone }, tone),
        id: tone,
        title: `${tone} record`,
        titleHref: "/record",
      })),
    }),
    createElement(Button, { id: "primary", variant: "primary" }, "Primary"),
    createElement(Button, { id: "critical", variant: "critical" }, "Critical"),
    createElement(
      "span",
      { id: "destructive-label" },
      "Delete selected records"
    )
  )
);

// Serialized into the fixture. Canvas resolves computed colour(srgb ...) as
// well as rgb/rgba, so mixed semantic colours are measured rather than mocked.
const sampleInteractions = () => {
  const context = document.createElement("canvas").getContext("2d");
  const color = (value) => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data].map((channel, index) =>
      index === 3 ? channel / 255 : channel
    );
  };
  const results = [];
  for (const theme of ["bezny-light", "bezny-dark"]) {
    document.documentElement.className = theme;
    const rows = [];
    for (const row of document.querySelectorAll("fieldset")) {
      const link = row.querySelector("a");
      const badge = row.querySelector("[data-type]");
      const states = [];
      for (const state of ["normal", "selected", "focus"]) {
        row.dataset.selected = String(state === "selected");
        if (state === "focus") {
          row.focus();
        }
        const style = getComputedStyle(row);
        const shadow = style.boxShadow.match(/rgba?\([^)]*\)/u);
        states.push({
          background: color(style.backgroundColor),
          badgeBackground: color(getComputedStyle(badge).backgroundColor),
          badgeText: color(getComputedStyle(badge).color),
          focus: shadow ? color(shadow[0]) : null,
          state,
          text: color(getComputedStyle(link).color),
        });
        row.blur();
      }
      rows.push({ states, tone: badge.dataset.type });
    }
    const label = document.querySelector("#destructive-label");
    const rootStyle = getComputedStyle(document.documentElement);
    label.style.color = rootStyle.getPropertyValue(
      "--bezny-structural-surface-danger"
    );
    label.style.backgroundColor = rootStyle.getPropertyValue(
      "--bezny-structural-surface-hover"
    );
    results.push({
      buttons: ["primary", "critical"].map((id) => {
        const style = getComputedStyle(document.querySelector(`#${id}`));
        return {
          background: color(style.backgroundColor),
          id,
          text: color(style.color),
        };
      }),
      destructive: {
        background: color(getComputedStyle(label).backgroundColor),
        text: color(getComputedStyle(label).color),
      },
      rows,
      theme,
    });
  }
  return results;
};
const blend = (foreground, background) =>
  foreground
    .slice(0, 3)
    .map(
      (value, index) =>
        value * foreground[3] + background[index] * (1 - foreground[3])
    );
const luminance = (color) => {
  const values = color.slice(0, 3).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
};
const contrast = (first, second) =>
  (Math.max(luminance(first), luminance(second)) + 0.05) /
  (Math.min(luminance(first), luminance(second)) + 0.05);
const requireContrast = (foreground, background, minimum, label) => {
  const ratio = contrast(blend(foreground, background), background);
  assert.ok(
    ratio >= minimum,
    `${label}: ${ratio.toFixed(2)}:1, needs ${minimum}:1`
  );
};
test("links, status badges, destructive labels and keyboard rings maintain contrast across interaction states", () => {
  const directory = mkdtempSync(
    path.join(tmpdir(), "bezny-interaction-contrast-")
  );
  try {
    const fixture = path.join(directory, "contrast.html");
    writeFileSync(
      fixture,
      `<!doctype html><html><head><style>${stylesheet}</style><style>* { transition: none !important; }</style></head><body>${content}<pre id="contrast-results"></pre><script>document.getElementById('contrast-results').textContent = JSON.stringify((${sampleInteractions.toString()})());</script></body></html>`
    );
    const browser = spawnSync(
      process.env.CHROMIUM_PATH ?? "chromium",
      [
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--no-first-run",
        `--user-data-dir=${path.join(directory, "profile")}`,
        "--dump-dom",
        pathToFileURL(fixture).href,
      ],
      { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, timeout: 30_000 }
    );
    assert.ifError(browser.error);
    assert.equal(browser.status, 0, browser.stderr);
    const match = browser.stdout.match(
      /<pre id="contrast-results">(?<results>[^<]+)<\/pre>/u
    );
    assert.ok(match, browser.stdout);
    const samples = JSON.parse(match.groups.results);
    assert.equal(samples.length, 2);
    for (const sample of samples) {
      assert.equal(sample.rows.length, tones.length);
      for (const row of sample.rows) {
        for (const state of row.states) {
          const label = `${sample.theme}/${row.tone}/${state.state}`;
          requireContrast(state.text, state.background, 4.5, `${label} link`);
          const badgeBackground = blend(
            state.badgeBackground,
            state.background
          );
          requireContrast(
            state.badgeText,
            badgeBackground,
            4.5,
            `${label} badge`
          );
          if (state.state === "focus") {
            assert.ok(state.focus, `${label} missing visible focus ring`);
            requireContrast(
              state.focus,
              state.background,
              3,
              `${label} focus ring`
            );
          }
        }
      }
      requireContrast(
        sample.destructive.text,
        sample.destructive.background,
        4.5,
        `${sample.theme} highlighted destructive action`
      );
      for (const button of sample.buttons) {
        requireContrast(
          button.text,
          button.background,
          4.5,
          `${sample.theme} ${button.id} button`
        );
      }
      assert.deepEqual(
        sample.buttons[0].background,
        [0, 126, 176, 1],
        "Brand fill must not be replaced with the text colour"
      );
    }
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});
