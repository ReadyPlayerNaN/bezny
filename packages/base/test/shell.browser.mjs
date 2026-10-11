/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Verify responsive CSS in actual Chromium, not jsdom. */
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
const drawerClass = css.match(/\.(?<name>_drawer_[\w]+)\[role=dialog\]/u)
  ?.groups?.name;
assert.ok(drawerClass);
const contentClass = css.match(
  /\.(?<name>_content_[\w]+)[^{]*\{transform:translate\(50%,-50%\)\}/u
)?.groups?.name;
assert.ok(contentClass);
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
          createElement(
            "a",
            { "aria-current": "page", href: "/articles" },
            "Articles"
          )
        )
      ),
    },
    "Page"
  )
);
const sample = () => {
  const root = document.querySelector("[data-navigation]");
  const nav = root.querySelector("nav");
  const button = root.querySelector("button");
  const drawer = document.querySelector("[role=dialog]");
  const box = drawer.getBoundingClientRect();
  return {
    columns: getComputedStyle(root).gridTemplateColumns,
    drawerHeight: box.height,
    drawerStart: drawer.dir === "rtl" ? innerWidth - box.right : box.left,
    drawerWidth: box.width,
    height: innerHeight,
    mainStart: root.querySelector("main").getBoundingClientRect().left,
    menu: getComputedStyle(button.parentElement).display,
    nav: getComputedStyle(nav).display,
    navWidth: nav.getBoundingClientRect().width,
    viewport: innerWidth,
  };
};
for (const width of [639, 640, 1023, 1024, 1280]) {
  for (const direction of ["ltr", "rtl"]) {
    test(`shell CSS selects the ${width}px ${direction} variant without viewport JavaScript`, () => {
      const directory = mkdtempSync(path.join(tmpdir(), "bezny-shell-"));
      try {
        const fixture = path.join(directory, "shell.html");
        writeFileSync(
          fixture,
          `<!doctype html><html dir="${direction}"><head><style>${css} html,body{margin:0;overflow:hidden} [role=dialog]{animation:none!important}</style></head><body>${markup}<div role="dialog" class="${contentClass} ${drawerClass}" dir="${direction}">Navigation</div><pre id="results"></pre><script>document.getElementById('results').textContent=JSON.stringify((${sample.toString()})());</script></body></html>`
        );
        const browser = spawnSync(
          process.env.CHROMIUM_PATH ?? "chromium",
          [
            "--headless",
            "--no-sandbox",
            "--disable-gpu",
            "--no-first-run",
            `--user-data-dir=${path.join(directory, "profile")}`,
            `--window-size=${width},900`,
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
        const result = JSON.parse(match.groups.data);
        assert.equal(result.viewport, width);
        assert.equal(result.nav, width >= 1024 ? "block" : "none");
        assert.equal(result.menu, width >= 1024 ? "none" : "flex");
        assert.equal(result.drawerWidth, width < 640 ? width : 256);
        assert.equal(result.drawerHeight, result.height);
        assert.equal(result.drawerStart, 0);
        if (width >= 1024) {
          assert.equal(result.navWidth, 256);
          if (direction === "ltr") {
            assert.equal(result.mainStart, 256);
          }
        }
      } finally {
        rmSync(directory, { force: true, recursive: true });
      }
    });
  }
}
