/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Exercise the production registered async filter and palette in a real browser. */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "../../base/test/component-browser-server.mjs";

const fixture = await startComponentBrowser("registered-filters-browser", {
  root: fileURLToPath(new URL("..", import.meta.url)),
  spa: true,
});
test.after(fixture.close);
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    test(`registered async reference ${theme} ${direction}`, async (context) => {
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
      const labels = await page.evaluate(() => window.collectionLabels);
      await page.evaluate(() => {
        window.referenceFixture.failures = 1;
      });
      const input = page.getByRole("combobox", {
        exact: true,
        name: "Related category",
      });
      await input.fill("News");
      await page
        .getByRole("button", { exact: true, name: labels.retry })
        .click();
      await expect(
        page.getByRole("option", { exact: true, name: "News" })
      ).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("button", { exact: true, name: labels.removeNews })
      ).toBeVisible();
      await expect(input).toBeFocused();
      assert.deepEqual(
        JSON.parse(new URL(page.url()).searchParams.get("filters")),
        { related: '["news"]' }
      );
      const calls = await page.evaluate(() => window.referenceFixture.calls);
      assert.equal(calls.length, 2);
      assert.ok(
        calls.every(
          (call) =>
            call.query === "News" &&
            call.limit === 20 &&
            call.locale === (direction === "rtl" ? "ar" : "en")
        )
      );
      await page.screenshot({
        path: path.join(
          fixture.artifacts,
          `reference-${theme}-${direction}.png`
        ),
      });
      await page.reload();
      await expect(
        page.getByRole("button", { exact: true, name: labels.removeNews })
      ).toBeVisible();
      await page.goBack();
      await expect(
        page.getByRole("button", { exact: true, name: labels.removeNews })
      ).toHaveCount(0);
      await page
        .getByRole("button", { exact: true, name: labels.palette })
        .click();
      await page
        .getByRole("option", { exact: true, name: labels.related })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog
        .getByRole("combobox", { exact: true, name: "Related category" })
        .fill("Guides");
      await expect(
        page.getByRole("option", { exact: true, name: "Guides" })
      ).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(
        dialog.getByRole("button", { exact: true, name: labels.removeGuides })
      ).toBeVisible();
      assert.equal(new URL(page.url()).searchParams.has("filters"), false);
      const geometry = await dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          overflow: element.scrollWidth > element.clientWidth,
          right: rect.right,
          width: innerWidth,
        };
      });
      assert.ok(
        geometry.left >= 0 &&
          geometry.right <= geometry.width &&
          !geometry.overflow
      );
      await page.screenshot({
        path: path.join(
          fixture.artifacts,
          `reference-${theme}-${direction}-palette.png`
        ),
      });
      await dialog
        .getByRole("button", { exact: true, name: labels.apply })
        .click();
      await expect(
        page.getByRole("link", { exact: true, name: "Beta" })
      ).toBeVisible();
      assert.deepEqual(
        JSON.parse(new URL(page.url()).searchParams.get("filters")),
        { related: '["guides"]' }
      );
      await page
        .getByRole("button", { exact: true, name: labels.clear })
        .click();
      assert.equal(new URL(page.url()).searchParams.has("filters"), false);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      assert.deepEqual(errors, []);
    });
  }
}
