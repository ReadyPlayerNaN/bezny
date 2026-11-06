/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Native built-public-entrypoint error-focus regression matrix. */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "../../base/test/component-browser-server.mjs";

const fixture = await startComponentBrowser("form-error-focus-browser", {
  root: fileURLToPath(new URL("..", import.meta.url)),
  spa: true,
});
test.after(fixture.close);
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    for (const view of ["create", "edit", "action"]) {
      for (const entrypoint of view === "action"
        ? ["button"]
        : ["button", "palette"]) {
        test(`error focus ${theme} ${direction} ${view} ${entrypoint}`, async (context) => {
          const page = await fixture.browser.newPage({
            viewport: { height: 844, width: 390 },
          });
          context.after(() => page.close());
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          const paths = {
            action: "/documents/1",
            create: "/documents/create",
            edit: "/documents/1/edit",
          };
          await page.goto(
            `${new URL(fixture.url).origin}${paths[view]}?theme=${theme}&language=${direction === "rtl" ? "ar" : "en"}`
          );
          const labels = await page.evaluate(
            () => window.formErrorFocus.labels
          );
          if (view === "action") {
            await page
              .getByRole("button", { exact: true, name: labels.palette })
              .click();
            await page
              .getByRole("option", { exact: true, name: "Revise" })
              .click();
          }
          const title = page.getByRole("textbox", {
            exact: true,
            name: "Title",
          });
          await title.fill("Retained draft");
          if (entrypoint === "palette") {
            await page
              .getByRole("button", { exact: true, name: labels.palette })
              .click();
            await page
              .getByRole("option", { exact: true, name: labels.save })
              .click();
          } else {
            await page
              .getByRole("button", {
                exact: true,
                name: view === "action" ? "Revise" : labels.save,
              })
              .focus();
            await page.keyboard.press("Enter");
          }
          await expect(title).toBeDisabled();
          await page.evaluate(() => window.formErrorFocus.reject());
          await expect(
            page.getByText("Already used", { exact: true })
          ).toBeVisible();
          await expect(title).toBeEnabled();
          await expect(title).toBeFocused();
          await expect(title).toHaveValue("Retained draft");
          await expect(title).toHaveAttribute("aria-invalid", "true");
          const notes = page.getByRole("textbox", {
            exact: true,
            name: "Notes",
          });
          await notes.fill("Reviewed");
          await expect(notes).toBeFocused();
          // Retrying still submits the retained form through its existing owner.
          await page
            .getByRole("button", {
              exact: true,
              name: view === "action" ? "Revise" : labels.save,
            })
            .click();
          await expect(title).toBeDisabled();
          await page.evaluate(() => window.formErrorFocus.resolve());
          await expect(
            page.getByRole("textbox", { exact: true, name: "Title" })
          ).toHaveCount(0);
          await expect(
            page.getByRole("heading", { exact: true, name: "Document" })
          ).toBeVisible();
          assert.equal(
            await page.evaluate(() => window.formErrorFocus.writes()),
            2
          );
          assert.deepEqual(errors, []);
        });
      }
    }
  }
}
