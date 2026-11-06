/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Exercise shipped runtime, controls and palette in native browsers. */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "../../base/test/component-browser-server.mjs";

const fixture = await startComponentBrowser("sorting-browser", {
  root: fileURLToPath(new URL("..", import.meta.url)),
  spa: true,
});
test.after(fixture.close);
const assertGeometry = async (dialog) => {
  const geometry = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      scrollWidth: element.scrollWidth,
      viewportHeight: innerHeight,
      viewportWidth: innerWidth,
      width: element.clientWidth,
    };
  });
  assert.ok(
    geometry.left >= 0 &&
      geometry.right <= geometry.viewportWidth &&
      geometry.bottom <= geometry.viewportHeight,
    JSON.stringify(geometry)
  );
  assert.ok(geometry.scrollWidth <= geometry.width, JSON.stringify(geometry));
};
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    test(`registered sorting ${theme} ${direction}`, async (context) => {
      const page = await fixture.browser.newPage({
        reducedMotion: "reduce",
        viewport: { height: 844, width: 390 },
      });
      context.after(async () => {
        await page.close();
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(
        `${new URL(fixture.url).origin}/articles?language=${direction === "rtl" ? "ar" : "en"}&theme=${theme}`
      );
      const labels = await page.evaluate(() => window.sortingLabels);
      const trigger = page.getByRole("button", {
        exact: true,
        name: labels.label,
      });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", {
        exact: true,
        name: labels.label,
      });
      const sortDirection = dialog.getByRole("combobox", {
        exact: true,
        name: labels.direction,
      });
      await expect(
        dialog.getByRole("combobox", { exact: true, name: labels.field })
      ).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(sortDirection).toBeFocused();
      await page.keyboard.press("Enter");
      const descending = page.getByRole("option", {
        exact: true,
        name: labels.descending,
      });
      await expect(descending).toBeVisible();
      await page.keyboard.press("End");
      await expect(descending).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(sortDirection).toHaveText(labels.descending);
      await expect(sortDirection).toBeFocused();
      await dialog
        .getByRole("button", { exact: true, name: labels.add })
        .click();
      await dialog
        .getByRole("button", { exact: true, name: labels.up })
        .click();
      assert.equal(new URL(page.url()).searchParams.has("sort"), false);
      await assertGeometry(dialog);
      await page.screenshot({
        path: path.join(fixture.artifacts, `${theme}-${direction}-list.png`),
      });
      await dialog
        .getByRole("button", { exact: true, name: labels.apply })
        .click();
      await expect(
        page.getByRole("link", { exact: true, name: "Gamma" })
      ).toBeVisible();
      await expect(trigger).toBeFocused();
      assert.deepEqual(
        JSON.parse(new URL(page.url()).searchParams.get("sort")),
        [
          { direction: "asc", key: "category" },
          { direction: "desc", key: "label" },
        ]
      );
      await page.reload();
      await expect(
        page.getByRole("link", { exact: true, name: "Gamma" })
      ).toBeVisible();
      await trigger.click();
      await dialog
        .getByRole("button", { exact: true, name: labels.removeTitle })
        .click();
      await expect(dialog.getByRole("combobox")).toHaveCount(2);
      await dialog
        .getByRole("button", { exact: true, name: labels.clear })
        .click();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      assert.equal(
        JSON.parse(new URL(page.url()).searchParams.get("sort")).length,
        2
      );
      await page
        .getByRole("button", { exact: true, name: labels.palette })
        .click();
      await page
        .getByRole("option", { exact: true, name: labels.label })
        .click();
      const palette = page.getByRole("dialog", {
        exact: true,
        name: labels.palette,
      });
      await assertGeometry(palette);
      await page.screenshot({
        path: path.join(fixture.artifacts, `${theme}-${direction}-palette.png`),
      });
      await palette
        .getByRole("button", { exact: true, name: labels.clear })
        .click();
      await palette
        .getByRole("button", { exact: true, name: labels.apply })
        .click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(
        page.getByRole("button", { exact: true, name: labels.palette })
      ).toBeFocused();
      assert.deepEqual(
        JSON.parse(new URL(page.url()).searchParams.get("sort")),
        []
      );
      await trigger.click();
      await dialog
        .getByRole("button", { exact: true, name: labels.defaults })
        .click();
      await dialog
        .getByRole("button", { exact: true, name: labels.apply })
        .click();
      await expect(trigger).toBeFocused();
      assert.equal(new URL(page.url()).searchParams.has("sort"), false);
      await page.goBack();
      await trigger.click();
      await expect(dialog.getByRole("combobox")).toHaveCount(0);
      await page.keyboard.press("Escape");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      assert.deepEqual(errors, []);
    });
  }
}
