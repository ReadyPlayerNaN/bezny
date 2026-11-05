/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Exercise the built components and real CSS in Chromium. */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import {
  EntityRowList,
  EntityRowListSkeleton,
  Skeleton,
  Table,
  TableCaption,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableScrollArea,
  TableSkeletonRow,
} from "@bezny/base";
import { chromium, expect } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const css = readFileSync(
  new URL(import.meta.resolve("@bezny/base/style.css")),
  "utf-8"
);
const artifacts = fileURLToPath(
  new URL("../../../.tmp/table-browser/", import.meta.url)
);
mkdirSync(artifacts, { recursive: true });
const columns = [
  "Expected",
  "Actual",
  "Delta",
  "Similarity",
  "Scaled",
  "Decay",
  "Decayed",
];
const table = createElement(
  TableScrollArea,
  { label: "Score comparison scroll area" },
  createElement(
    Table,
    { "data-testid": "comparison" },
    createElement(TableCaption, null, "Scoring breakdown"),
    createElement(
      TableHead,
      null,
      createElement(
        TableRow,
        null,
        createElement(TableHeaderCell, null, "Experience"),
        ...columns.map((column) =>
          createElement(TableHeaderCell, { key: column, numeric: true }, column)
        )
      )
    ),
    createElement(
      TableBody,
      null,
      createElement(
        TableRow,
        null,
        createElement(TableHeaderCell, { scope: "row" }, "Engineering"),
        ...columns.map((column) =>
          createElement(
            TableCell,
            { key: column, numeric: true },
            "999,999.125"
          )
        )
      ),
      createElement(TableSkeletonRow, { columns: columns.length + 1 })
    )
  )
);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  headless: true,
});
after(async () => {
  await browser.close();
});

for (const theme of ["light", "dark"]) {
  for (const width of [390, 1280]) {
    for (const direction of ["ltr", "rtl"]) {
      test(`tables and skeletons: ${theme}, ${width}px, ${direction}`, async (context) => {
        const page = await browser.newPage({
          reducedMotion: "no-preference",
          viewport: { height: 1000, width },
        });
        context.after(async () => {
          await page.close();
        });
        const opposite = theme === "light" ? "dark" : "light";
        const markup = renderToStaticMarkup(
          createElement(
            "main",
            null,
            table,
            createElement(
              "div",
              { "data-testid": "loading" },
              createElement(EntityRowListSkeleton, {
                label: "Loading records",
                rows: 1,
              })
            ),
            createElement(
              "div",
              { "data-testid": "ready" },
              createElement(EntityRowList, {
                rows: [
                  { description: "Description", id: "a", title: "Company" },
                ],
              })
            ),
            createElement(
              "div",
              { "data-testid": "small-loading" },
              createElement(EntityRowListSkeleton, {
                label: "Loading compact records",
                rows: 1,
                variant: "small",
              })
            ),
            createElement(
              "div",
              { "data-testid": "small-ready" },
              createElement(EntityRowList, {
                rows: [
                  { description: "Description", id: "b", title: "Company" },
                ],
                variant: "small",
              })
            ),
            createElement(
              "div",
              { className: `bezny-${opposite}` },
              createElement(Skeleton, { "data-testid": "nested-skeleton" })
            ),
            createElement(Skeleton, { "data-testid": "root-skeleton" })
          )
        );
        await page.setContent(
          `<!doctype html><html class="bezny-${theme}" dir="${direction}"><head><style>${css}</style></head><body>${markup}</body></html>`
        );
        const area = page.getByRole("region", {
          name: "Score comparison scroll area",
        });
        await expect(
          page.getByRole("table", { name: "Scoring breakdown" })
        ).toBeVisible();
        await expect(
          page.getByRole("rowheader", { name: "Engineering" })
        ).toBeVisible();
        await expect(page.getByRole("cell")).toHaveCount(columns.length);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        );
        assert.equal(
          await page
            .getByRole("cell")
            .first()
            .evaluate((cell) => getComputedStyle(cell).textAlign),
          "end"
        );
        assert.equal(
          await page
            .getByRole("cell")
            .first()
            .evaluate((cell) => getComputedStyle(cell).fontVariantNumeric),
          "tabular-nums"
        );
        await area.focus();
        await expect(area).toBeFocused();
        assert.notEqual(
          await area.evaluate((element) => getComputedStyle(element).boxShadow),
          "none"
        );
        if (width === 390) {
          assert.ok(
            await area.evaluate(
              (element) => element.scrollWidth > element.clientWidth
            )
          );
          await page.keyboard.press(
            direction === "ltr" ? "ArrowRight" : "ArrowLeft"
          );
          await expect
            .poll(
              async () =>
                await area.evaluate((element) => Math.abs(element.scrollLeft))
            )
            .toBeGreaterThan(0);
        }
        const skeleton = page.getByTestId("root-skeleton");
        const expectedBackground =
          theme === "light" ? "rgb(232, 237, 241)" : "rgb(48, 57, 64)";
        const oppositeBackground =
          opposite === "light" ? "rgb(232, 237, 241)" : "rgb(48, 57, 64)";
        await expect(skeleton).toHaveCSS(
          "background-color",
          expectedBackground
        );
        await expect(page.getByTestId("nested-skeleton")).toHaveCSS(
          "background-color",
          oppositeBackground
        );
        assert.notEqual(
          await skeleton.evaluate(
            (element) => getComputedStyle(element).animationName
          ),
          "none"
        );
        await Promise.all(
          ["", "small-"].map(async (prefix) => {
            const loadingHeight = await page
              .getByTestId(`${prefix}loading`)
              .evaluate((element) => element.getBoundingClientRect().height);
            const readyHeight = await page
              .getByTestId(`${prefix}ready`)
              .evaluate((element) => element.getBoundingClientRect().height);
            assert.equal(
              loadingHeight,
              readyHeight,
              `${prefix}row geometry changes on load`
            );
          })
        );
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(skeleton).toHaveCSS("animation-name", "none");
        await page.screenshot({
          fullPage: true,
          path: `${artifacts}/${theme}-${width}-${direction}.png`,
        });
      });
    }
  }
}
