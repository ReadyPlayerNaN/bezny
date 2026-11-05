/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Verify published prose typography and native semantic content in Chromium. */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { Prose } from "@bezny/base";
import { chromium, expect } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const css = readFileSync(
  new URL(import.meta.resolve("@bezny/base/style.css")),
  "utf-8"
);
const artifacts = fileURLToPath(
  new URL("../../../.tmp/prose-browser/", import.meta.url)
);
mkdirSync(artifacts, { recursive: true });
const longText = "unbreakable".repeat(60);
const markup = renderToStaticMarkup(
  createElement(
    Prose,
    { id: "prose" },
    ...[1, 2, 3, 4, 5, 6].map((level) =>
      createElement(`h${level}`, { key: level }, `Heading ${level}`)
    ),
    createElement(
      "p",
      null,
      "Readable legal content with ",
      createElement("a", { href: "#terms" }, "terms"),
      " and ",
      createElement("code", null, "inline code"),
      "."
    ),
    createElement("ul", null, createElement("li", null, "A clause")),
    createElement("blockquote", null, "A quotation"),
    createElement(
      "pre",
      { tabIndex: 0 },
      createElement("code", null, longText)
    ),
    createElement(
      "table",
      null,
      createElement("caption", null, "Authored table"),
      createElement(
        "tbody",
        null,
        createElement(
          "tr",
          null,
          createElement("th", { scope: "row" }, "Policy"),
          createElement("td", null, longText)
        )
      )
    ),
    createElement("hr"),
    createElement("p", null, "Final paragraph")
  )
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  headless: true,
});
test.after(async () => {
  await browser.close();
});
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    test(`prose ${theme} ${direction}`, async (context) => {
      const page = await browser.newPage({
        viewport: { height: 900, width: 390 },
      });
      context.after(async () => {
        await page.close();
      });
      await page.setContent(
        `<!doctype html><html class="bezny-${theme}" dir="${direction}"><head><style>${css}</style></head><body>${markup}</body></html>`
      );
      await expect(page.getByRole("heading")).toHaveCount(6);
      await expect(
        page.getByRole("table", { name: "Authored table" })
      ).toBeVisible();
      const sizes = await page
        .locator("h1,h2,h3,h4,h5,h6")
        .evaluateAll((headings) =>
          headings.map((heading) =>
            Number(getComputedStyle(heading).fontSize.replace("px", ""))
          )
        );
      assert.deepEqual(sizes, [32, 24, 20, 18, 16, 14]);
      assert.equal(
        await page
          .locator("#prose")
          .evaluate((element) => getComputedStyle(element).lineHeight),
        "28px"
      );
      assert.ok(
        await page
          .locator("pre")
          .evaluate((element) => element.scrollWidth > element.clientWidth)
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      const link = page.getByRole("link", { name: "terms" });
      await link.focus();
      await expect(link).toBeFocused();
      assert.notEqual(
        await link.evaluate((element) => getComputedStyle(element).boxShadow),
        "none"
      );
      assert.equal(
        await page
          .locator("blockquote")
          .evaluate(
            (element) => getComputedStyle(element).borderInlineStartWidth
          ),
        "1px"
      );
      await page.screenshot({
        fullPage: true,
        path: path.join(artifacts, `${theme}-${direction}.png`),
      });
    });
  }
}
