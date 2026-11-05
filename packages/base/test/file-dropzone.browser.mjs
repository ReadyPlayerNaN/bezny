/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Native file chooser, keyboard and drop behavior with shipped CSS. */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { expect } from "@playwright/test";

import { startComponentBrowser } from "./component-browser-server.mjs";

const fixture = await startComponentBrowser("file-dropzone-browser");
test.after(fixture.close);
const invoice = {
  buffer: Buffer.from("PDF"),
  mimeType: "application/pdf",
  name: "invoice.pdf",
};
for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    test(`file dropzone ${theme} ${direction}`, async (context) => {
      const page = await fixture.browser.newPage({
        reducedMotion: "reduce",
        viewport: { height: 700, width: 390 },
      });
      context.after(async () => {
        await page.close();
      });
      await page.goto(fixture.url);
      await page.evaluate(
        ({ mode, dir }) => {
          document.documentElement.className = `bezny-${mode}`;
          document.documentElement.dir = dir;
        },
        { dir: direction, mode: theme }
      );
      const input = page.getByLabel("Choose a file");
      await input.focus();
      const chooser = page.waitForEvent("filechooser");
      await page.keyboard.press("Enter");
      const fileChooser = await chooser;
      await fileChooser.setFiles(invoice);
      await expect(
        page.getByText("invoice.pdf", { exact: true })
      ).toBeVisible();
      await expect(page.getByLabel("Changes")).toHaveText("1");
      const again = page.waitForEvent("filechooser");
      await input.click();
      const repeatedChooser = await again;
      await repeatedChooser.setFiles(invoice);
      await expect(page.getByLabel("Changes")).toHaveText("2");
      await page.getByRole("button", { name: "Clear file" }).click();
      await expect(input).toBeFocused();
      await expect(page.getByText("invoice.pdf", { exact: true })).toHaveCount(
        0
      );
      const data = await page.evaluateHandle(() => {
        const transfer = new DataTransfer();
        transfer.items.add(
          new File(
            ["content"],
            "long-invoice-name-for-an-accessible-file-selection-control.pdf",
            { type: "application/pdf" }
          )
        );
        return transfer;
      });
      await input.dispatchEvent("dragover", { dataTransfer: data });
      await input.dispatchEvent("drop", { dataTransfer: data });
      await expect(page.getByLabel("Changes")).toHaveText("4");
      await expect(page.getByText("7 bytes", { exact: true })).toBeVisible();
      await page.getByRole("checkbox", { name: "Disable upload" }).check();
      await input.dispatchEvent("drop", { dataTransfer: data });
      await expect(page.getByLabel("Changes")).toHaveText("4");
      await expect(input).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Clear file" })
      ).toBeDisabled();
      await data.dispose();
      await page.getByRole("checkbox", { name: "Disable upload" }).uncheck();
      await page.keyboard.press("Shift+Tab");
      await expect(
        page.getByRole("button", { name: "Clear file" })
      ).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(input).toBeFocused();
      assert.notEqual(
        await input.evaluate(
          (element) => getComputedStyle(element.parentElement).boxShadow
        ),
        "none"
      );
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
