/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Exercise the RHF cron field and nested Radix portals with published assets. */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "./component-browser-server.mjs";

const fixture = await startComponentBrowser("cron-browser");
test.after(fixture.close);
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    test(`cron builder ${theme} ${direction}`, async (context) => {
      const page = await fixture.browser.newPage({
        reducedMotion: "reduce",
        viewport: { height: 900, width: 390 },
      });
      context.after(async () => {
        await page.close();
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        window.cronViolations = [];
        document.addEventListener("securitypolicyviolation", (event) =>
          window.cronViolations.push(event.violatedDirective)
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
      const input = page.getByRole("textbox", {
        exact: true,
        name: "Schedule",
      });
      const trigger = page.getByRole("button", { name: "Cron builder" });
      await expect(input).toHaveAttribute("dir", "ltr");
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", { name: "Cron builder" });
      await expect(dialog).toBeVisible();
      assert.equal(
        await dialog.evaluate(
          (element) => getComputedStyle(element).backgroundColor
        ),
        theme === "light" ? "rgb(37, 43, 47)" : "rgb(255, 255, 255)"
      );
      await page.getByRole("radio", { name: "Hourly" }).click();
      await page.getByRole("combobox", { name: "Every N hours" }).click();
      await page.getByRole("option", { exact: true, name: "03" }).click();
      await expect(input).toHaveValue("0 */3 * * *");
      await page.getByRole("radio", { name: "Monthly" }).click();
      await page.getByRole("button", { exact: true, name: "31" }).click();
      await expect(input).toHaveValue("0 0 1,31 * *");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      await page.screenshot({
        fullPage: true,
        path: path.join(fixture.artifacts, `${theme}-${direction}.png`),
      });
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await page.getByRole("button", { name: "External update" }).click();
      await trigger.click();
      await expect(page.getByRole("radio", { name: "Weekly" })).toHaveAttribute(
        "aria-checked",
        "true"
      );
      const weekday = page.getByRole("button", { exact: true, name: "Friday" });
      await expect(weekday).toHaveAttribute("aria-pressed", "true");
      await page.getByRole("radio", { name: "Custom" }).click();
      const raw = page.getByRole("textbox", { name: "Raw expression" });
      await raw.fill("0 12 * * MON-FRI");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { exact: true, name: "Save" }).click();
      await expect(page.getByLabel("Saved expression")).toHaveText(
        "0 12 * * MON-FRI"
      );
      await input.fill("");
      await page.getByRole("button", { exact: true, name: "Save" }).click();
      await expect(input).toBeFocused();
      await expect(page.getByRole("alert")).toHaveText("Schedule required");
      await page
        .getByRole("checkbox", { exact: true, name: "Disabled" })
        .check();
      await expect(input).toBeDisabled();
      await expect(trigger).toBeDisabled();
      assert.deepEqual(await page.evaluate(() => window.cronViolations), []);
      assert.deepEqual(errors, []);
    });
  }
}
