/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Native built-public-entrypoint explicit-target matrix. */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "../../base/test/component-browser-server.mjs";

const fixture = await startComponentBrowser("explicit-action-targets-browser", {
  root: fileURLToPath(new URL("..", import.meta.url)),
  spa: true,
});
test.after(fixture.close);
const open = async (page, entrypoint) => {
  const trigger = page.getByRole("button", {
    exact: true,
    name: entrypoint === "menu" ? "Group menu" : "Group action",
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  if (entrypoint === "menu") {
    await expect(
      page.getByRole("menuitem", { exact: true, name: "Archive this group" })
    ).toBeFocused();
    await page.keyboard.press("Enter");
  }
  await expect(page.getByRole("dialog")).toBeVisible();
  return trigger;
};
const submit = async (page) => {
  await page
    .getByRole("dialog")
    .getByRole("button", { exact: true, name: "Archive group" })
    .focus();
  await page.keyboard.press("Enter");
};
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    for (const entrypoint of ["button", "menu"]) {
      test(`explicit group actions ${theme} ${direction} ${entrypoint}`, async (context) => {
        const page = await fixture.browser.newPage({
          viewport: { height: 844, width: 390 },
        });
        context.after(() => page.close());
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(
          `${new URL(fixture.url).origin}/documents?theme=${theme}&language=${direction === "rtl" ? "ar" : "en"}`
        );
        await expect(page.getByText("Alpha", { exact: true })).toBeVisible();
        await page.evaluate(() => window.explicitActions.select(["other"]));
        const trigger = await open(page, entrypoint);
        const dialog = page.getByRole("dialog");
        await expect(
          dialog.getByText("Archive exactly: Alpha, Beta", { exact: true })
        ).toBeVisible();
        const reason = dialog.getByRole("textbox", {
          exact: true,
          name: "Reason",
        });
        await submit(page);
        await expect(reason).toBeFocused();
        assert.equal(
          await page.evaluate(() => window.explicitActions.writes().length),
          0
        );
        await reason.fill("A draft");
        await submit(page);
        await expect(reason).toBeDisabled();
        await page.evaluate(() => window.explicitActions.reject());
        await expect(
          page.getByText("Choose another reason", { exact: true })
        ).toBeVisible();
        await expect(reason).toBeFocused();
        await expect(reason).toHaveValue("A draft");
        await submit(page);
        await expect(reason).toBeDisabled();
        await page.evaluate(() =>
          window.explicitActions.resolve({
            failedIds: ["b"],
            message: "Beta needs retry",
          })
        );
        await expect(dialog.getByRole("alert")).toHaveText("Beta needs retry");
        assert.deepEqual(
          await page.evaluate(() => window.explicitActions.selection()),
          ["other"]
        );
        if (entrypoint === "menu") {
          await page.screenshot({
            path: `${fixture.artifacts}/partial-${theme}-${direction}.png`,
          });
        }
        await page.evaluate(() => window.explicitActions.select(["a"]));
        await submit(page);
        await expect(reason).toBeDisabled();
        await page.evaluate(() =>
          window.explicitActions.resolve({ message: "Completed" })
        );
        await expect(dialog.getByRole("status")).toHaveText("Completed");
        assert.deepEqual(
          await page.evaluate(() =>
            window.explicitActions
              .writes()
              .map(({ ids, values }) => ({ ids, values }))
          ),
          [
            { ids: ["a", "b"], values: { reason: "A draft" } },
            { ids: ["a", "b"], values: { reason: "A draft" } },
            { ids: ["b"], values: { reason: "A draft" } },
          ]
        );
        const cancel = await page.evaluate(() => window.explicitActions.cancel);
        await dialog.getByRole("button", { exact: true, name: cancel }).focus();
        await page.keyboard.press("Enter");
        await expect(trigger).toBeFocused();
        assert.deepEqual(
          await page.evaluate(() => window.explicitActions.selection()),
          ["a"]
        );

        await open(page, entrypoint);
        await expect(reason).toHaveValue("");
        await reason.fill("Abandoned draft");
        await submit(page);
        await expect(reason).toBeDisabled();
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(trigger).toBeFocused();
        assert.equal(
          await page.evaluate(
            () => window.explicitActions.writes().at(-1).aborted
          ),
          true
        );
        await page.evaluate(() =>
          window.explicitActions.resolve({
            failedIds: ["a"],
            message: "Late feedback",
          })
        );
        await open(page, entrypoint);
        await expect(reason).toHaveValue("");
        await expect(
          page.getByText("Late feedback", { exact: true })
        ).toHaveCount(0);
        assert.deepEqual(
          await page.evaluate(() => window.explicitActions.selection()),
          ["a"]
        );
        await page.keyboard.press("Escape");
        await expect(trigger).toBeFocused();
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
