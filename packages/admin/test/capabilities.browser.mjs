/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Native shipped default-screen and palette acceptance. */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "../../base/test/component-browser-server.mjs";

const fixture = await startComponentBrowser("capabilities-browser", {
  root: fileURLToPath(new URL("..", import.meta.url)),
  spa: true,
});
test.after(fixture.close);
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    test(`capability batch ${theme} ${direction}`, async (context) => {
      const page = await fixture.browser.newPage({
        reducedMotion: "reduce",
        viewport: { height: 844, width: 390 },
      });
      context.after(() => page.close());
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(
        `${new URL(fixture.url).origin}/documents?theme=${theme}&language=${direction === "rtl" ? "ar" : "en"}`
      );
      await expect(page.getByText("Alpha", { exact: true })).toBeVisible();
      assert.equal(
        await page.getByRole("link", { exact: true, name: "Alpha" }).count(),
        0
      );
      const labels = await page.evaluate(() => window.capabilities.labels);
      const minimum = page.getByRole("button", { name: /^Minimum:/u });
      await minimum.focus();
      await page.keyboard.press("Enter");
      const number = page.getByRole("spinbutton", {
        exact: true,
        name: "Minimum",
      });
      await expect(number).toBeFocused();
      await number.fill("10.5");
      await page
        .getByRole("button", { exact: true, name: labels.apply })
        .click();
      await expect(minimum).toBeFocused();
      assert.deepEqual(
        JSON.parse(new URL(page.url()).searchParams.get("filters")),
        { minimum: "10.5" }
      );
      const from = page.getByRole("button", { name: /^From:/u });
      await from.click();
      const date = page.getByRole("textbox", { exact: true, name: "From" });
      await expect(date).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(from).toBeFocused();
      const palette = page.getByRole("button", {
        exact: true,
        name: labels.palette,
      });
      await palette.focus();
      await page.keyboard.press("Enter");
      await page.getByRole("option", { exact: true, name: "Archive" }).click();
      const dialog = page.getByRole("dialog", { exact: true, name: "Archive" });
      const reason = dialog.getByRole("textbox", {
        exact: true,
        name: "Reason",
      });
      await expect(reason).toBeFocused();
      await reason.fill("Outdated");
      await dialog
        .getByRole("button", { exact: true, name: "Archive" })
        .click();
      await expect(dialog.getByRole("alert")).toBeVisible();
      await expect(reason).toHaveValue("Outdated");
      await page.screenshot({
        path: path.join(fixture.artifacts, `${theme}-${direction}-action.png`),
      });
      await dialog
        .getByRole("button", { exact: true, name: "Archive" })
        .click();
      await expect(dialog.getByText("Archived successfully")).toBeVisible();
      await dialog
        .getByRole("button", { exact: true, name: labels.cancel })
        .click();
      await expect(palette).toBeFocused();
      await palette.click();
      await page
        .getByRole("combobox", { exact: true, name: labels.search })
        .fill("different match");
      await expect(
        page.getByRole("option", { exact: true, name: "Remote profile" })
      ).toBeVisible();
      await page.screenshot({
        path: path.join(fixture.artifacts, `${theme}-${direction}-search.png`),
      });
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(() => window.capabilities.writes.includes("remote"))
        )
        .toBeTruthy();
      await page.evaluate(() => window.capabilities.fail());
      await expect(page.getByRole("alert")).toBeVisible();
      await expect(page.getByText("private failure")).toHaveCount(0);
      await page.evaluate(() => window.capabilities.recover());
      await page
        .getByRole("alert")
        .locator("..")
        .getByRole("button", { exact: true, name: labels.retry })
        .click();
      await expect(page.getByText("Alpha", { exact: true })).toBeVisible();
      await page
        .getByRole("button", { exact: true, name: labels.create })
        .click();
      await page
        .getByRole("textbox", { exact: true, name: "Title" })
        .fill("New document");
      await page
        .getByRole("textbox", { exact: true, name: "Email" })
        .fill("invalid");
      await page
        .getByRole("button", { exact: true, name: labels.save })
        .click();
      await expect(page.getByText("Enter an email address")).toBeVisible();
      await expect(
        page.getByRole("textbox", { exact: true, name: "Email" })
      ).toBeFocused();
      await expect(
        page.getByLabel("Password", { exact: true })
      ).toHaveAttribute("type", "password");
      await page.screenshot({
        path: path.join(fixture.artifacts, `${theme}-${direction}-form.png`),
      });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      assert.deepEqual(errors, []);
    });
  }
}
