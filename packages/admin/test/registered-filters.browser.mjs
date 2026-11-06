/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Exercise shipped registered pages in a real browser. */
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
    test(`registered multi-choice ${theme} ${direction}`, async (context) => {
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
      const filter = page.getByRole("button", { name: /^Category:/u });
      await filter.focus();
      await page.keyboard.press("Enter");
      const news = page.getByRole("checkbox", { exact: true, name: "News" });
      await news.focus();
      await page.keyboard.press("Space");
      await expect(filter).toHaveText("Category: News");
      await page.keyboard.press("Escape");
      await expect(filter).toBeFocused();
      await filter.press("Enter");
      const guides = page.getByRole("checkbox", {
        exact: true,
        name: "Guides",
      });
      await guides.focus();
      await page.keyboard.press("Space");
      await expect(filter).toHaveText("Category: News, Guides");
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("link", { exact: true, name: "Beta" })
      ).toBeVisible();
      assert.deepEqual(
        JSON.parse(new URL(page.url()).searchParams.get("filters")),
        { category: '["news","guides"]' }
      );
      await page.reload();
      await expect(page.locator("html")).toHaveClass(`bezny-${theme}`);
      await expect(filter).toHaveText("Category: News, Guides");
      await page.goBack();
      await expect(filter).toHaveText("Category: News");
      await page
        .getByRole("button", { exact: true, name: labels.palette })
        .click();
      await page
        .getByRole("option", { exact: true, name: labels.category })
        .click();
      await page.getByRole("checkbox", { exact: true, name: "Guides" }).focus();
      await page.keyboard.press("Space");
      const geometry = await page.getByRole("dialog").evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const form = element.querySelector("form");
        return {
          bottom: rect.bottom,
          formScrollWidth: form?.scrollWidth,
          formWidth: form?.clientWidth,
          left: rect.left,
          right: rect.right,
          viewportHeight: innerHeight,
          viewportWidth: innerWidth,
        };
      });
      assert.ok(
        geometry.left >= 0 &&
          geometry.right <= geometry.viewportWidth &&
          geometry.bottom <= geometry.viewportHeight
      );
      assert.ok(geometry.formScrollWidth <= geometry.formWidth);
      await page.screenshot({
        path: path.join(fixture.artifacts, `${theme}-${direction}-palette.png`),
      });
      await page
        .getByRole("button", { exact: true, name: labels.apply })
        .click();
      await expect(filter).toHaveText("Category: News, Guides");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(
        page.getByRole("button", { exact: true, name: labels.palette })
      ).toBeFocused();
      await page.screenshot({
        path: path.join(fixture.artifacts, `${theme}-${direction}.png`),
      });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      await page
        .getByRole("button", { exact: true, name: labels.clear })
        .click();
      await expect(filter).not.toHaveText(/News/u);
      assert.equal(new URL(page.url()).searchParams.has("filters"), false);
      await filter.click();
      await page
        .locator("label")
        .filter({ hasText: "Complete collection" })
        .click();
      await expect(filter).toHaveText("Category: Complete collection");
      assert.deepEqual(
        JSON.parse(new URL(page.url()).searchParams.get("filters")),
        { category: '["all"]' }
      );
      await expect(
        page.getByRole("checkbox", { exact: true, name: "Complete collection" })
      ).toBeChecked();
      await page.keyboard.press("Escape");
      await expect(filter).toBeFocused();
      assert.deepEqual(errors, []);
    });
  }
}
