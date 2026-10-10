/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Node's test runner does not provide Vitest's parameterized API. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import {
  Button,
  CheckboxInput,
  FieldFeedback,
  FieldLabel,
  Heading,
  RadioGroupInput,
  RadioInput,
  TextareaInput,
  TextInput,
  ToggleInput,
} from "@bezny/base";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const stylesheet = readFileSync(
  new URL(import.meta.resolve("@bezny/base/style.css")),
  "utf-8"
);
const resultsPattern = /<pre id="theme-results">(?<results>[^<]+)<\/pre>/u;
const colorComponentsPattern = /[\d.]+/gu;

const controls = renderToStaticMarkup(
  createElement(
    "section",
    { id: "controls" },
    createElement(Heading, { id: "heading" }, "Theme preview"),
    createElement(Button, { id: "primary" }, "Primary"),
    createElement(
      Button,
      { id: "secondary", variant: "secondary" },
      "Secondary"
    ),
    createElement(Button, { id: "critical", variant: "critical" }, "Critical"),
    createElement(FieldLabel, { htmlFor: "text", id: "label" }, "Name"),
    createElement(TextInput, { id: "text", placeholder: "Name" }),
    createElement(TextInput, { disabled: true, id: "disabled" }),
    createElement(TextInput, { "aria-invalid": true, id: "invalid" }),
    createElement(TextareaInput, { "aria-label": "Notes", id: "textarea" }),
    createElement(CheckboxInput, { "aria-label": "Accept", id: "checkbox" }),
    createElement(CheckboxInput, {
      "aria-label": "Accepted",
      defaultChecked: true,
      id: "checked",
    }),
    createElement(
      RadioGroupInput,
      { "aria-label": "Plan", defaultValue: "basic" },
      createElement(RadioInput, {
        "aria-label": "Basic",
        id: "radio",
        value: "basic",
      })
    ),
    createElement(ToggleInput, { "aria-label": "Notifications", id: "toggle" }),
    createElement(ToggleInput, {
      "aria-label": "Enabled",
      defaultChecked: true,
      id: "toggle-checked",
    }),
    createElement(ToggleInput, {
      "aria-invalid": true,
      "aria-label": "Required toggle",
      id: "toggle-invalid",
    }),
    createElement(FieldFeedback, {
      error: "Required",
      errorId: "error",
      help: "Help",
      helpId: "help",
    })
  )
);

// This function is serialized into the fixture and executed in Chromium.
const sampleThemes = (document, getComputedStyle, matchMedia) => {
  const root = document.documentElement;
  const style = (id) => getComputedStyle(document.querySelector(`#${id}`));
  const wrapper = (id) =>
    getComputedStyle(document.querySelector(`#${id}`).parentElement);
  const sample = () => {
    const primary = document.querySelector("#primary");
    primary.focus();
    const snapshot = {
      background: getComputedStyle(root).backgroundColor,
      border: wrapper("text").borderTopColor,
      buttons: {},
      checkbox: style("checkbox").backgroundColor,
      checked: style("checked").backgroundColor,
      disabled: wrapper("disabled").backgroundColor,
      error: style("error").color,
      focus: style("primary")
        .getPropertyValue("--bezny-control-button-focus-ring")
        .trim(),
      heading: style("heading").color,
      help: style("help").color,
      input: wrapper("text").backgroundColor,
      inputText: style("text").color,
      invalid: wrapper("invalid").borderTopColor,
      label: style("label").color,
      placeholder: getComputedStyle(
        document.querySelector("#text"),
        "::placeholder"
      ).color,
      radio: style("radio").backgroundColor,
      scheme: getComputedStyle(root).colorScheme,
      text: getComputedStyle(root).color,
      textarea: wrapper("textarea").backgroundColor,
      toggle: style("toggle").backgroundColor,
      toggleChecked: style("toggle-checked").backgroundColor,
      toggleInvalid: style("toggle-invalid").outlineColor,
    };
    for (const id of ["primary", "secondary", "critical"]) {
      const button = document.querySelector(`#${id}`);
      const colors = {
        background: style(id).backgroundColor,
        text: style(id).color,
      };
      for (const state of ["hover", "active"]) {
        button.style.backgroundColor = style(id).getPropertyValue(
          `--bezny-control-button-background-${state}`
        );
        colors[state] = style(id).backgroundColor;
      }
      button.style.backgroundColor = "";
      snapshot.buttons[id] = colors;
    }
    return snapshot;
  };
  const snapshots = {
    prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
    system: sample(),
  };
  root.className = "bezny-light";
  snapshots.light = sample();
  root.className = "bezny-dark";
  snapshots.dark = sample();
  root.className = "bezny-light bezny-dark";
  snapshots.both = sample();
  root.className = "";
  snapshots.restored = sample();
  root.className = "bezny-light";
  const section = document.querySelector("#controls");
  section.className = "bezny-dark";
  snapshots.nestedDark = {
    input: wrapper("text").backgroundColor,
    text: style("heading").color,
  };
  const inner = document.createElement("div");
  inner.className = "bezny-light";
  section.append(inner);
  inner.append(
    document.querySelector("#text").parentElement,
    document.querySelector("#heading")
  );
  snapshots.nestedLight = {
    input: wrapper("text").backgroundColor,
    text: style("heading").color,
  };
  return snapshots;
};

const luminance = (color) => {
  const components = [...color.matchAll(colorComponentsPattern)]
    .slice(0, 3)
    .map(([value]) => Number(value));
  const normalized = components.map((value) =>
    color.startsWith("color(") ? value : value / 255
  );
  const linear = normalized.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};
const contrast = (first, second) => {
  const values = [luminance(first), luminance(second)].toSorted(
    (left, right) => right - left
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
};

for (const osMode of ["light", "dark"]) {
  test(`themes follow ${osMode} OS settings with class overrides and nested boundaries`, () => {
    const directory = mkdtempSync(path.join(tmpdir(), "bezny-theme-browser-"));
    try {
      const fixture = path.join(directory, "theme.html");
      writeFileSync(
        fixture,
        `<!doctype html><html><head><style>${stylesheet}</style><style>* { transition: none !important; }</style></head><body>${controls}<pre id="theme-results"></pre><script>document.getElementById("theme-results").textContent = JSON.stringify((${sampleThemes.toString()})(document, getComputedStyle, matchMedia));</script></body></html>`
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
          ...(osMode === "dark" ? ["--force-dark-mode"] : []),
          pathToFileURL(fixture).href,
        ],
        { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, timeout: 30_000 }
      );
      assert.ifError(browser.error);
      assert.equal(browser.status, 0, browser.stderr);
      const match = browser.stdout.match(resultsPattern);
      assert.ok(match, browser.stdout);
      const samples = JSON.parse(match.groups.results);
      assert.equal(samples.prefersDark, osMode === "dark");
      assert.deepEqual(samples.system, samples[osMode]);
      assert.deepEqual(samples.restored, samples.system);
      assert.deepEqual(samples.both, samples.dark);
      assert.equal(samples.light.scheme, "light");
      assert.equal(samples.dark.scheme, "dark");
      assert.equal(samples.light.background, "rgb(255, 255, 255)");
      assert.equal(samples.dark.background, "rgb(23, 27, 30)");
      assert.equal(samples.dark.input, "rgb(37, 43, 47)");
      assert.notEqual(samples.light.focus, samples.dark.focus);
      assert.deepEqual(samples.nestedDark, {
        input: samples.dark.input,
        text: samples.dark.text,
      });
      assert.deepEqual(samples.nestedLight, {
        input: samples.light.input,
        text: samples.light.text,
      });
      for (const mode of ["light", "dark"]) {
        const sample = samples[mode];
        assert.equal(sample.heading, sample.text);
        assert.equal(sample.label, sample.text);
        assert.equal(sample.textarea, sample.input);
        assert.equal(sample.checkbox, sample.input);
        assert.equal(sample.checked, sample.buttons.primary.background);
        assert.equal(sample.radio, sample.buttons.primary.background);
        assert.notEqual(sample.disabled, sample.input);
        assert.equal(sample.invalid, sample.error);
        assert.equal(sample.toggleChecked, sample.buttons.primary.background);
        assert.equal(sample.toggleInvalid, sample.error);
        assert.notEqual(sample.toggle, sample.background);
        assert.notEqual(sample.focus, "none");
        for (const text of [sample.text, sample.help, sample.error]) {
          assert.ok(
            contrast(text, sample.background) >= 4.5,
            `${mode}: page text contrast`
          );
        }
        for (const text of [sample.inputText, sample.placeholder]) {
          assert.ok(
            contrast(text, sample.input) >= 4.5,
            `${mode}: input text contrast`
          );
        }
        assert.ok(
          contrast(sample.border, sample.input) >= 3,
          `${mode}: input boundary contrast`
        );
        for (const button of Object.values(sample.buttons)) {
          for (const background of [
            button.background,
            button.hover,
            button.active,
          ]) {
            assert.ok(
              contrast(button.text, background) >= 4.5,
              `${mode}: button text contrast`
            );
          }
        }
      }
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
}
