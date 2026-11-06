/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Native published-entrypoint form cancellation acceptance. */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "../../base/test/component-browser-server.mjs";

const fixture = await startComponentBrowser("form-cancel-browser", {
  root: fileURLToPath(new URL("..", import.meta.url)),
  spa: true,
});
test.after(fixture.close);
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    for (const view of ["edit", "create"]) {
      for (const entrypoint of ["button", "palette"]) {
        test(`form cancellation ${theme} ${direction} ${view} ${entrypoint}`, async (context) => {
          const page = await fixture.browser.newPage({
            viewport: { height: 844, width: 390 },
          });
          context.after(() => page.close());
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          const pathname =
            view === "edit" ? "/documents/2/edit" : "/documents/create";
          await page.goto(
            `${new URL(fixture.url).origin}${pathname}?theme=${theme}&language=${direction === "rtl" ? "ar" : "en"}`
          );
          const title = page.getByRole("textbox", {
            exact: true,
            name: "Title",
          });
          await expect(title).toHaveValue(view === "edit" ? "Beta" : "");
          await title.fill("Unsaved draft");
          const labels = await page.evaluate(
            () => window.formCancellation.labels
          );
          if (entrypoint === "palette") {
            await page
              .getByRole("button", { exact: true, name: labels.palette })
              .click();
            const cancel = page.getByRole("option", {
              exact: true,
              name: labels.cancel,
            });
            await expect(cancel).toBeVisible();
            await cancel.click();
          } else {
            await page
              .getByRole("button", { exact: true, name: labels.cancel })
              .focus();
            await page.keyboard.press("Enter");
          }
          const destination = view === "edit" ? "/documents/2" : "/documents";
          await expect
            .poll(() => new URL(page.url()).pathname)
            .toBe(destination);
          await expect(
            page.getByRole("heading", {
              exact: true,
              name: view === "edit" ? "Beta" : "Documents",
            })
          ).toBeVisible();
          assert.equal(
            await page.evaluate(() => window.formCancellation.writes()),
            0
          );
          assert.deepEqual(errors, []);
        });
      }
    }
  }
}
