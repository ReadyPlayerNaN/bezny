/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Browser integration of mounted hidden forms and shipped styles. */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "./component-browser-server.mjs";

const fixture = await startComponentBrowser("accordion-browser");
test.after(fixture.close);
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    test(`accordion keeps drafts without hidden focus targets: ${theme} ${direction}`, async (context) => {
      const page = await fixture.browser.newPage({
        reducedMotion: "reduce",
        viewport: { height: 700, width: 390 },
      });
      context.after(async () => {
        await page.close();
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(fixture.url);
      await page.evaluate(
        ({ mode, dir }) => {
          document.documentElement.className = `bezny-${mode}`;
          document.documentElement.dir = dir;
        },
        { dir: direction, mode: theme }
      );
      const draft = page.getByRole("button", { exact: true, name: "Draft" });
      const input = page.getByRole("textbox", { name: "Draft text" });
      await input.fill("Unsaved draft");
      await draft.focus();
      await page.keyboard.press("Space");
      await expect(input).toBeHidden();
      await expect(page.locator('input[name="draft"]')).toHaveCount(1);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Other" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Save" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByLabel("Saved")).toHaveText("Unsaved draft");
      await draft.focus();
      await page.keyboard.press("Enter");
      await expect(input).toHaveValue("Unsaved draft");
      await expect(input).toBeVisible();
      await page.getByRole("button", { name: "Other" }).click();
      await expect(input).toBeHidden();
      await expect(page.getByRole("region", { name: "Other" })).toBeVisible();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      await page.screenshot({
        fullPage: true,
        path: path.join(fixture.artifacts, `${theme}-${direction}.png`),
      });
      assert.deepEqual(errors, []);
    });
  }
}
