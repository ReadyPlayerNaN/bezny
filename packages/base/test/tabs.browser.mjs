/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Exercise shipped tab focus, local overflow and hidden panels. */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "./component-browser-server.mjs";

const fixture = await startComponentBrowser("tabs-browser");
test.after(fixture.close);
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    test(`tabs ${theme} ${direction}`, async (context) => {
      const page = await fixture.browser.newPage({
        reducedMotion: "reduce",
        viewport: { height: 700, width: 390 },
      });
      context.after(async () => {
        await page.close();
      });
      await page.goto(`${fixture.url}?dir=${direction}`);
      await page.evaluate(
        ({ mode, dir }) => {
          document.documentElement.className = `bezny-${mode}`;
          document.documentElement.dir = dir;
        },
        { dir: direction, mode: theme }
      );
      const english = page.getByRole("tab", { name: "English content" });
      const czech = page.getByRole("tab", { name: "Czech content" });
      const input = page.getByRole("textbox", { name: "English draft" });
      await input.fill("Local draft");
      await english.focus();
      await page.keyboard.press(
        direction === "rtl" ? "ArrowLeft" : "ArrowRight"
      );
      await expect(czech).toBeFocused();
      await expect(czech).toHaveAttribute("aria-selected", "true");
      await expect(input).toBeHidden();
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("tabpanel", { name: "Czech content" })
      ).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("button", { name: "Translate" })
      ).toBeFocused();
      await czech.focus();
      await page.keyboard.press("End");
      await expect(
        page.getByRole("tab", { name: "Other language content" })
      ).toBeFocused();
      await page.keyboard.press("Home");
      await expect(english).toBeFocused();
      await expect(input).toHaveValue("Local draft");
      await expect(input).toBeVisible();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      await page.screenshot({
        fullPage: true,
        path: path.join(fixture.artifacts, `${theme}-${direction}.png`),
      });
    });
  }
}
