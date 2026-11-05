/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Public-package calendar behavior, timezone isolation and focus require a browser. */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "./component-browser-server.mjs";

const fixture = await startComponentBrowser("calendar-browser");
test.after(fixture.close);
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    test(`calendar ${theme} ${direction}`, async (context) => {
      const timezoneId =
        theme === "light" ? "America/Los_Angeles" : "Pacific/Kiritimati";
      const page = await fixture.browser.newPage({
        reducedMotion: "reduce",
        timezoneId,
        viewport: { height: 950, width: 390 },
      });
      context.after(async () => {
        await page.close();
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        window.calendarViolations = [];
        document.addEventListener("securitypolicyviolation", (event) =>
          window.calendarViolations.push(event.violatedDirective)
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
      const date = page.getByRole("textbox", { exact: true, name: "Date" });
      const month = page.getByRole("textbox", { exact: true, name: "Month" });
      const trigger = page.getByRole("button", { name: "Open calendar" });
      await expect(date).toHaveValue("02/29/2024");
      await expect(month).toHaveValue("02/2024");
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", { name: "Open calendar" });
      await expect(dialog).toBeVisible();
      await expect(
        page.getByRole("button", { name: "February 29, 2024" })
      ).toBeFocused();
      assert.equal(
        await dialog.evaluate(
          (element) => getComputedStyle(element).backgroundColor
        ),
        theme === "light" ? "rgb(37, 43, 47)" : "rgb(255, 255, 255)"
      );
      await expect(
        dialog.locator("[data-calendar-key][tabindex='0']")
      ).toHaveCount(1);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      await page.screenshot({
        fullPage: true,
        path: path.join(fixture.artifacts, `${theme}-${direction}.png`),
      });
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("button", { exact: true, name: "Clear" })
      ).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(
        page.getByRole("button", { name: "February 29, 2024" })
      ).toBeFocused();
      await page.keyboard.press(
        direction === "rtl" ? "ArrowLeft" : "ArrowRight"
      );
      await expect(
        page.getByRole("button", { name: "March 1, 2024" })
      ).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(
        page.getByRole("button", { name: "March 8, 2024" })
      ).toBeFocused();
      await page.keyboard.press("Home");
      await expect(
        page.getByRole("button", { name: "March 4, 2024" })
      ).toBeFocused();
      await page.keyboard.press("End");
      await expect(
        page.getByRole("button", { name: "March 10, 2024" })
      ).toBeFocused();
      await page.keyboard.press("PageUp");
      await expect(
        page.getByRole("button", { name: "February 10, 2024" })
      ).toBeFocused();
      await page.keyboard.press("PageDown");
      await page.keyboard.press("Shift+PageUp");
      await expect(
        page.getByRole("button", { name: "March 10, 2023" })
      ).toBeFocused();
      await page.keyboard.press("Shift+PageDown");
      await page.keyboard.press("Enter");
      await expect(date).toHaveValue("03/10/2024");
      await expect(trigger).toBeFocused();
      await expect(page.getByLabel("Save count")).toHaveText("0");
      await page.getByRole("button", { exact: true, name: "Save" }).click();
      await expect(page.getByLabel("Saved values")).toHaveText(
        '{"date":"2024-03-10","month":"2024-02"}'
      );
      await date.fill("02/31/2024");
      await page.getByRole("button", { exact: true, name: "Save" }).click();
      await expect(page.getByLabel("Save count")).toHaveText("1");
      await expect(page.getByRole("alert")).toHaveText("Enter a valid date");
      await expect(date).toHaveValue("02/31/2024");
      await page.getByRole("button", { exact: true, name: "Reset" }).click();
      await expect(date).toHaveValue("02/29/2024");
      await expect(page.getByRole("alert")).toHaveCount(0);
      await trigger.click();
      await page
        .getByRole("button", { name: "Choose year: February 2024" })
        .click();
      await expect(
        page.getByRole("button", { name: "Previous years" })
      ).toBeDisabled();
      await page.getByRole("button", { name: "Next years" }).click();
      await expect(
        page.getByRole("button", { exact: true, name: "2028" })
      ).toBeFocused();
      await expect(
        page.getByRole("button", { exact: true, name: "2031" })
      ).toBeDisabled();
      await page.getByRole("button", { name: "Previous years" }).click();
      await expect(
        page.getByRole("button", { exact: true, name: "2024" })
      ).toBeFocused();
      await page.getByRole("button", { exact: true, name: "2025" }).click();
      await expect(date).toHaveValue("02/29/2024");
      await expect(
        page.getByRole("button", { name: "February 28, 2025" })
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(date).toHaveValue("02/28/2025");
      const monthTrigger = page.getByRole("button", {
        exact: true,
        name: "Choose month",
      });
      await monthTrigger.click();
      await expect(
        page.getByRole("button", { name: "February 2024" })
      ).toBeFocused();
      await page.getByRole("button", { name: "Choose year: 2024" }).click();
      await page.getByRole("button", { exact: true, name: "2026" }).click();
      await page.getByRole("button", { name: "June 2026" }).click();
      await expect(month).toHaveValue("06/2026");
      await monthTrigger.click();
      await page.screenshot({
        fullPage: true,
        path: path.join(fixture.artifacts, `${theme}-${direction}-months.png`),
      });
      await page.keyboard.press("Escape");
      await expect(monthTrigger).toBeFocused();
      await month.fill("13/2024");
      await page.getByRole("button", { exact: true, name: "Save" }).click();
      await expect(page.getByLabel("Save count")).toHaveText("1");
      await expect(page.getByRole("alert")).toHaveText("Enter a valid month");
      await page
        .getByRole("button", { exact: true, name: "External update" })
        .click();
      await expect(date).toHaveValue("06/15/2025");
      await expect(month).toHaveValue("06/2025");
      await trigger.click();
      await page.getByRole("button", { exact: true, name: "Today" }).click();
      await monthTrigger.click();
      await page
        .getByRole("button", { exact: true, name: "Current month" })
        .click();
      await page.getByRole("button", { exact: true, name: "Save" }).click();
      await expect(page.getByLabel("Saved values")).toHaveText(
        '{"date":"2024-03-02","month":"2024-03"}'
      );
      await trigger.click();
      await page.getByRole("button", { exact: true, name: "Clear" }).click();
      await page.getByRole("button", { exact: true, name: "Save" }).click();
      await expect(date).toBeFocused();
      await expect(page.getByRole("alert")).toHaveText("Date required");
      await page
        .getByRole("checkbox", { exact: true, name: "Disabled" })
        .check();
      await expect(date).toBeDisabled();
      await expect(month).toBeDisabled();
      await expect(trigger).toBeDisabled();
      await expect(monthTrigger).toBeDisabled();
      assert.deepEqual(
        await page.evaluate(() => window.calendarViolations),
        []
      );
      assert.deepEqual(errors, []);
    });
  }
}
test("calendar focus remains visible in forced colors", async (context) => {
  const page = await fixture.browser.newPage({
    viewport: { height: 900, width: 390 },
  });
  context.after(async () => {
    await page.close();
  });
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(fixture.url);
  await page.getByRole("button", { name: "Open calendar" }).focus();
  await page.keyboard.press("Enter");
  const selected = page.getByRole("button", { name: "February 29, 2024" });
  await expect(selected).toBeFocused();
  assert.equal(
    await selected.evaluate(
      (element) => getComputedStyle(element).outlineStyle
    ),
    "solid"
  );
  await page.screenshot({
    fullPage: true,
    path: path.join(fixture.artifacts, "forced-colors.png"),
  });
});

test("localized typed values remain ISO-only after committing", async (context) => {
  const page = await fixture.browser.newPage({
    timezoneId: "America/Los_Angeles",
  });
  context.after(async () => {
    await page.close();
  });
  await page.goto(`${fixture.url}?locale=cs`);
  const date = page.getByRole("textbox", { exact: true, name: "Date" });
  const month = page.getByRole("textbox", { exact: true, name: "Month" });
  await date.fill("31122024");
  await month.fill("082024");
  await page.getByRole("button", { exact: true, name: "Save" }).click();
  await expect(page.getByLabel("Saved values")).toHaveText(
    '{"date":"2024-12-31","month":"2024-08"}'
  );
  await expect(date).toHaveValue("31. 12. 2024");
});
