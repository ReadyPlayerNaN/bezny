/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Native built-public-entrypoint view-specific form matrix. */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "../../base/test/component-browser-server.mjs";

const fixture = await startComponentBrowser("view-specific-forms-browser", {
  root: fileURLToPath(new URL("..", import.meta.url)),
  spa: true,
});
test.after(fixture.close);
const paletteCommand = async (page, labels, name) => {
  await page.getByRole("button", { exact: true, name: labels.palette }).click();
  await page.getByRole("option", { exact: true, name }).click();
};
const submit = async (page, labels, entrypoint) => {
  if (entrypoint === "palette") {
    await paletteCommand(page, labels, labels.save);
  } else {
    await page.getByRole("button", { exact: true, name: labels.save }).focus();
    await page.keyboard.press("Enter");
  }
};
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    for (const entrypoint of ["button", "palette"]) {
      test(`view-specific forms ${theme} ${direction} ${entrypoint}`, async (context) => {
        const page = await fixture.browser.newPage({
          viewport: { height: 844, width: 390 },
        });
        context.after(() => page.close());
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(
          `${new URL(fixture.url).origin}/documents/create?theme=${theme}&language=${direction === "rtl" ? "ar" : "en"}`
        );
        const labels = await page.evaluate(() => window.viewForms.labels);
        const createTitle = page.getByRole("textbox", {
          exact: true,
          name: "Create title",
        });
        await expect(createTitle).toHaveValue("Draft");
        await expect(
          page.getByLabel("Password", { exact: true })
        ).toHaveAttribute("type", "password");
        await submit(page, labels, entrypoint);
        await expect(
          page.getByText("Enter matching credentials", { exact: true })
        ).toBeVisible();
        await expect(
          page.getByLabel("Confirmation", { exact: true })
        ).toBeFocused();
        assert.equal(
          await page.evaluate(() => window.viewForms.writes().length),
          0
        );
        await createTitle.fill("  Created title  ");
        await page.getByLabel("Password", { exact: true }).fill("secret-value");
        await page
          .getByLabel("Confirmation", { exact: true })
          .fill("secret-value");
        await submit(page, labels, entrypoint);
        await expect(createTitle).toBeDisabled();
        await page.evaluate(() => window.viewForms.reject());
        await expect(
          page.getByText("Create title unavailable", { exact: true })
        ).toBeVisible();
        await expect(createTitle).toBeFocused();
        await expect(createTitle).toHaveValue("  Created title  ");
        if (entrypoint === "button") {
          await page.screenshot({
            path: `${fixture.artifacts}/create-${theme}-${direction}.png`,
          });
        }
        await expect(
          page.getByText("Wrong view error", { exact: true })
        ).toHaveCount(0);
        await submit(page, labels, entrypoint);
        await expect(createTitle).toBeDisabled();
        await page.evaluate(() => window.viewForms.resolve());
        await expect(
          page.getByRole("heading", { exact: true, name: "Document" })
        ).toBeVisible();
        assert.equal(
          JSON.stringify(
            await page.evaluate(() => window.viewForms.snapshot())
          ).includes("secret-value"),
          false
        );
        await expect(page.getByText("Password", { exact: true })).toHaveCount(
          0
        );

        await paletteCommand(page, labels, labels.edit);
        const editTitle = page.getByRole("textbox", {
          exact: true,
          name: "Edit title",
        });
        await expect(editTitle).toHaveValue("Created title");
        await expect(page.getByLabel("Password", { exact: true })).toHaveCount(
          0
        );
        await expect(
          page.getByLabel("Confirmation", { exact: true })
        ).toHaveCount(0);
        await page
          .getByRole("button", { exact: true, name: labels.palette })
          .click();
        await expect(
          page.getByRole("option", { exact: true, name: "Password" })
        ).toHaveCount(0);
        await expect(
          page.getByRole("option", { exact: true, name: "Score" })
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await editTitle.fill("");
        await submit(page, labels, entrypoint);
        await expect(
          page.getByText("Supply an edit title", { exact: true })
        ).toBeVisible();
        await expect(editTitle).toBeFocused();
        await editTitle.fill("  Updated title  ");
        await page
          .getByRole("spinbutton", { exact: true, name: "Score" })
          .fill("9");
        await submit(page, labels, entrypoint);
        await expect(editTitle).toBeDisabled();
        await page.evaluate(() => window.viewForms.reject());
        await expect(
          page.getByText("Edit title unavailable", { exact: true })
        ).toBeVisible();
        await expect(editTitle).toBeFocused();
        await expect(editTitle).toHaveValue("  Updated title  ");
        if (entrypoint === "button") {
          await page.screenshot({
            path: `${fixture.artifacts}/update-${theme}-${direction}.png`,
          });
        }
        await submit(page, labels, entrypoint);
        await expect(editTitle).toBeDisabled();
        await page.evaluate(() => window.viewForms.resolve());
        await expect(
          page.getByRole("heading", { exact: true, name: "Document" })
        ).toBeVisible();
        assert.deepEqual(await page.evaluate(() => window.viewForms.writes()), [
          {
            values: {
              confirmation: "secret-value",
              password: "secret-value",
              title: "Created title",
            },
            view: "create",
          },
          {
            values: {
              confirmation: "secret-value",
              password: "secret-value",
              title: "Created title",
            },
            view: "create",
          },
          { values: { score: 9, title: "Updated title" }, view: "update" },
          { values: { score: 9, title: "Updated title" }, view: "update" },
        ]);

        await paletteCommand(page, labels, labels.create);
        await expect(createTitle).toHaveValue("Draft");
        await expect(page.getByLabel("Password", { exact: true })).toHaveValue(
          ""
        );
        await page.getByLabel("Password", { exact: true }).fill("discard-me");
        await paletteCommand(page, labels, labels.cancel);
        await expect
          .poll(() => new URL(page.url()).pathname)
          .toBe("/documents");
        await page.goBack();
        await expect(createTitle).toHaveValue("Draft");
        await expect(page.getByLabel("Password", { exact: true })).toHaveValue(
          ""
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          true
        );
        assert.deepEqual(errors, []);
      });
    }
  }
}
