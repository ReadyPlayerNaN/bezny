/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Test native HTML and responsive CSS in actual Chromium. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { Shell } from "@bezny/base";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const css = readFileSync(
  new URL(import.meta.resolve("@bezny/base/style.css")),
  "utf-8"
);
const markup = renderToStaticMarkup(
  createElement(
    Shell,
    {
      header: "Brand",
      navigation: createElement(
        "ul",
        null,
        createElement(
          "li",
          null,
          createElement("a", { href: "/articles" }, "Articles")
        )
      ),
    },
    "Page"
  )
);
const exercise = () => {
  const root = document.querySelector("[data-navigation]");
  const nav = root.querySelector("nav");
  const main = root.querySelector("main");
  const trigger = root.querySelector('button[popovertargetaction="toggle"]');
  const sample = () => ({
    display: getComputedStyle(nav).display,
    headerTop: root.querySelector("header").getBoundingClientRect().top,
    height: innerHeight,
    mainLeft: main.getBoundingClientRect().left,
    mainWidth: main.getBoundingClientRect().width,
    navHeight: nav.getBoundingClientRect().height,
    navLeft: nav.getBoundingClientRect().left,
    navTop: nav.getBoundingClientRect().top,
    navWidth: nav.getBoundingClientRect().width,
    open: nav.matches(":popover-open"),
    trigger: getComputedStyle(trigger).display,
    viewport: innerWidth,
  });
  const closed = sample();
  trigger.click();
  sample();
  const entering = root.getAnimations({ subtree: true });
  for (const animation of entering) {
    animation.pause();
    animation.currentTime = 100;
  }
  const halfway = sample();
  for (const animation of entering) {
    animation.finish();
  }
  const opened = sample();
  root.querySelector('button[popovertargetaction="hide"]').click();
  sample();
  const exiting = root.getAnimations({ subtree: true });
  for (const animation of exiting) {
    animation.pause();
    animation.currentTime = 60;
  }
  const closing = sample();
  for (const animation of exiting) {
    animation.finish();
  }
  const returned = sample();
  return {
    closed,
    closing,
    halfway,
    mainCount: root.querySelectorAll("main").length,
    navigationCount: root.querySelectorAll("nav").length,
    opened,
    returned,
  };
};
for (const width of [639, 640, 1023, 1024, 1280]) {
  for (const direction of ["ltr", "rtl"]) {
    for (const reduced of [false, true]) {
      test(`single native navigation at ${width}px ${direction}, reduced motion ${reduced}`, () => {
        const directory = mkdtempSync(path.join(tmpdir(), "bezny-shell-"));
        try {
          const fixture = path.join(directory, "shell.html");
          writeFileSync(
            fixture,
            `<!doctype html><html dir="${direction}"><head><style>${css} html,body{margin:0;overflow:hidden}</style></head><body>${markup}<pre id="results"></pre><script>document.getElementById('results').textContent=JSON.stringify((${exercise.toString()})());</script></body></html>`
          );
          const browser = spawnSync(
            process.env.CHROMIUM_PATH ?? "chromium",
            [
              "--headless",
              "--no-sandbox",
              "--disable-gpu",
              "--no-first-run",
              ...(reduced ? ["--force-prefers-reduced-motion"] : []),
              `--user-data-dir=${path.join(directory, "profile")}`,
              `--window-size=${width},900`,
              "--virtual-time-budget=1000",
              "--dump-dom",
              pathToFileURL(fixture).href,
            ],
            { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, timeout: 30_000 }
          );
          assert.ifError(browser.error);
          assert.equal(browser.status, 0, browser.stderr);
          const match = browser.stdout.match(
            /<pre id="results">(?<data>[^<]+)<\/pre>/u
          );
          assert.ok(match, browser.stdout);
          const {
            closed,
            halfway,
            opened,
            closing,
            returned,
            navigationCount,
            mainCount,
          } = JSON.parse(match.groups.data);
          assert.equal(navigationCount, 1);
          assert.equal(mainCount, 1);
          assert.equal(closed.viewport, width);
          assert.equal(closed.display, width >= 1024 ? "block" : "none");
          assert.equal(closed.trigger, width >= 1024 ? "none" : "flex");
          assert.equal(opened.open, true);
          assert.equal(returned.open, false);
          assert.equal(opened.headerTop, 0);
          assert.equal(opened.navWidth, width < 640 ? width : 256);
          assert.equal(opened.navTop, width < 640 ? 0 : 48);
          if (width < 640) {
            assert.equal(opened.navHeight, opened.height);
          }
          if (width >= 640 && width < 1024) {
            assert.equal(closed.mainWidth, width);
            assert.equal(opened.mainWidth, width);
            assert.equal(closed.mainLeft, 0);
            assert.equal(opened.mainLeft, direction === "ltr" ? 256 : -256);
            assert.equal(returned.mainLeft, 0);
            assert.equal(returned.display, "none");
            if (!reduced) {
              assert.ok(
                Math.abs(halfway.mainLeft) > 0 &&
                  Math.abs(halfway.mainLeft) < 256
              );
              assert.ok(
                Math.abs(closing.mainLeft) > 0 &&
                  Math.abs(closing.mainLeft) < 256
              );
            }
          }
          if (width >= 1024) {
            assert.equal(opened.mainLeft, direction === "ltr" ? 256 : 0);
            assert.equal(returned.display, "block");
            assert.equal(opened.mainWidth, width - 256);
          }
        } finally {
          rmSync(directory, { force: true, recursive: true });
        }
      });
    }
  }
}
