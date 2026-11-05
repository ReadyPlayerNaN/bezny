/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Exercise public-package comboboxes and modal/portal focus in a real browser. */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "./component-browser-server.mjs";

const alphaOptionName = /^Alpha /u;
const fixture = await startComponentBrowser("autocomplete-browser");
test.after(fixture.close);
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    test(`controlled pickers ${theme} ${direction}`, async (context) => {
      const page = await fixture.browser.newPage({
        reducedMotion: "reduce",
        viewport: { height: 1000, width: 390 },
      });
      context.after(async () => {
        await page.close();
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        window.pickerViolations = [];
        document.addEventListener("securitypolicyviolation", (event) =>
          window.pickerViolations.push(event.violatedDirective)
        );
      });
      await page.goto(`${fixture.url}?dir=${direction}`);
      await page.evaluate(
        ({ mode, dir }) => {
          document.documentElement.className = `bezny-${mode}`;
          document.documentElement.dir = dir;
          document.querySelector("#portal").className =
            mode === "light" ? "bezny-dark" : "bezny-light";
        },
        { dir: direction, mode: theme }
      );
      const input = page.getByRole("combobox", {
        exact: true,
        name: "Company",
      });
      await input.fill("a");
      await expect(input).toBeFocused();
      const list = page.getByRole("listbox", { name: "Suggestions" });
      await expect(list).toBeVisible();
      assert.equal(
        await list
          .locator("..")
          .evaluate((element) => getComputedStyle(element).backgroundColor),
        theme === "light" ? "rgb(37, 43, 47)" : "rgb(255, 255, 255)"
      );
      await expect(
        page.getByRole("option", { name: "Unavailable" })
      ).toBeDisabled();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      await page.screenshot({
        fullPage: true,
        path: path.join(fixture.artifacts, `${theme}-${direction}.png`),
      });
      await page.keyboard.press("ArrowDown");
      await expect(input).toHaveAttribute(
        "aria-activedescendant",
        await page.getByRole("option", { name: "Beta" }).getAttribute("id")
      );
      await page.keyboard.press("Enter");
      await expect(input).toHaveValue("Beta");
      await expect(input).toBeFocused();
      await expect(list).toHaveCount(0);
      await expect(page.getByLabel("Submits", { exact: true })).toHaveText("0");
      await page.getByRole("button", { name: "Clear selection" }).click();
      await expect(input).toBeFocused();
      await input.fill("late");
      await expect(
        page.getByText("Loading suggestions", { exact: true })
      ).toBeVisible();
      const calls = await page.getByLabel("Query calls").textContent();
      await page.getByRole("button", { name: "Deliver results" }).click();
      await input.click();
      await expect(list).toBeVisible();
      await expect(page.getByLabel("Query calls")).toHaveText(calls);
      await input.dispatchEvent("compositionstart");
      await input.dispatchEvent("keydown", { isComposing: true, key: "Enter" });
      await expect(page.getByLabel("Selected company")).toHaveText("none");
      await input.dispatchEvent("compositionend");
      await page.keyboard.press("Escape");
      await expect(input).toBeFocused();
      await expect(input).toHaveValue("late");
      await input.fill("error");
      await expect(page.getByRole("alert")).toHaveText("Search unavailable");
      await input.fill("missing");
      await expect(page.getByText("No matches", { exact: true })).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("combobox", { name: "Skills" })
      ).toBeFocused();
      await expect(list).toHaveCount(0);
      const skills = page.getByRole("combobox", { name: "Skills" });
      await skills.fill("a");
      await expect(
        page.getByRole("option", { name: alphaOptionName })
      ).toHaveCount(0);
      await page.keyboard.press("Enter");
      await expect(skills).toBeDisabled();
      const group = page.getByRole("group", { name: "Selected skills" });
      await expect(group).toBeFocused();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      await page.screenshot({
        fullPage: true,
        path: path.join(
          fixture.artifacts,
          `${theme}-${direction}-selected.png`
        ),
      });
      await page
        .getByRole("button", { exact: true, name: "Remove Alpha" })
        .click();
      await expect(group).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(skills).toBeFocused();
      await expect(skills).toBeEnabled();
      await skills.fill("a");
      await expect(
        page.getByRole("option", { exact: true, name: "Beta" })
      ).toHaveCount(0);
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { exact: true, name: "Open dialog" })
        .click();
      const dialog = page.getByRole("dialog", { name: "Choose company" });
      await expect(dialog).toBeVisible();
      const nested = page.getByRole("combobox", { name: "Dialog company" });
      await nested.fill("a");
      await expect(list).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(list).toHaveCount(0);
      await expect(dialog).toBeVisible();
      await expect(nested).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Open dialog" })
      ).toBeFocused();
      await page
        .getByRole("checkbox", { exact: true, name: "Disabled" })
        .check();
      await expect(input).toBeDisabled();
      await expect(skills).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Remove Beta" })
      ).toBeDisabled();
      assert.deepEqual(await page.evaluate(() => window.pickerViolations), []);
      assert.deepEqual(errors, []);
    });
  }
}
