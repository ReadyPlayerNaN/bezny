/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Exercise shipped JSON controls and CSS in Chromium. */
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { chromium, expect } from "@playwright/test";
import { build } from "vite";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const scratch = fileURLToPath(
  new URL("../../../.tmp/json-viewer-browser/", import.meta.url)
);
await mkdir(scratch, { recursive: true });
const directory = await mkdtemp(path.join(scratch, "browser-"));
await build({
  build: {
    emptyOutDir: false,
    outDir: directory,
    rolldownOptions: {
      input: path.join(packageRoot, "test/json-viewer-browser.html"),
    },
  },
  configFile: false,
  logLevel: "warn",
  root: packageRoot,
});
const contentTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
};
const server = createServer(async (request, response) => {
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
  );
  response.setHeader("X-Content-Type-Options", "nosniff");
  const { pathname } = new URL(request.url ?? "/", "http://127.0.0.1");
  const target = path.resolve(directory, `.${pathname}`);
  const type = contentTypes[path.extname(target)];
  if (
    request.method !== "GET" ||
    !target.startsWith(`${directory}${path.sep}`) ||
    !type
  ) {
    response.writeHead(404).end();
    return;
  }
  try {
    const contents = await readFile(target);
    response.setHeader("Content-Type", type);
    response.writeHead(200).end(contents);
  } catch {
    response.writeHead(404).end();
  }
});
const listening = once(server, "listening");
server.listen(0, "127.0.0.1");
await listening;
const address = server.address();
assert.ok(address && typeof address === "object");
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  headless: true,
});
test.after(async () => {
  await browser.close();
  await server[Symbol.asyncDispose]();
});

for (const theme of ["light", "dark"]) {
  for (const direction of ["ltr", "rtl"]) {
    for (const width of [390, 1280]) {
      test(`JSON viewer ${theme} ${direction} ${width}`, async (context) => {
        const page = await browser.newPage({
          reducedMotion: "reduce",
          viewport: { height: 900, width },
        });
        context.after(async () => {
          await page.close();
        });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.addInitScript(() => {
          window.jsonViolations = [];
          document.addEventListener("securitypolicyviolation", (event) =>
            window.jsonViolations.push(event.violatedDirective)
          );
        });
        await page.goto(
          `${origin}/test/json-viewer-browser.html?dir=${direction}`
        );
        await page.evaluate(
          ({ themeName, dir }) => {
            document.documentElement.className = `bezny-${themeName}`;
            document.documentElement.dir = dir;
          },
          { dir: direction, themeName: theme }
        );
        const viewer = page.getByRole("region", { name: "Task payload" });
        const branch = viewer.getByRole("button", { name: "a/b: Object(1)" });
        await branch.focus();
        await page.keyboard.press("Enter");
        await expect(branch).toHaveAttribute("aria-expanded", "true");
        const controlledId = await branch.getAttribute("aria-controls");
        await expect(page.locator(`[id="${controlledId}"]`)).toBeVisible();
        await page.keyboard.press("Space");
        await expect(branch).toBeFocused();
        await expect(page.locator(`[id="${controlledId}"]`)).toBeHidden();
        await viewer.getByRole("button", { name: "Expand all" }).click();
        const leaf = viewer.getByRole("button", { name: '"override"' });
        await leaf.focus();
        await page.keyboard.press("Enter");
        await expect(page.getByLabel("Inspected pointer")).toHaveText(
          "/a~1b/~0key/0/"
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        );
        await page.screenshot({
          fullPage: true,
          path: path.join(scratch, `${theme}-${direction}-${width}.png`),
        });
        const tree = viewer.getByRole("radio", { name: "Tree" });
        await tree.focus();
        await page.keyboard.press(
          direction === "rtl" ? "ArrowLeft" : "ArrowRight"
        );
        await expect(viewer.getByRole("radio", { name: "Raw" })).toBeFocused();
        await page.keyboard.press("Enter");
        const raw = viewer.locator("pre");
        await expect(raw).toBeVisible();
        await expect(
          viewer.getByRole("button", { name: "Expand all" })
        ).toBeDisabled();
        await page.keyboard.press("Tab");
        await expect(raw).toBeFocused();
        assert.ok(
          await raw.evaluate(
            (element) => element.scrollWidth > element.clientWidth
          )
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        );
        const nested = page.getByRole("region", {
          name: "Nested light payload",
        });
        const nestedColor = await nested.evaluate(
          (element) => getComputedStyle(element).backgroundColor
        );
        assert.equal(nestedColor, "rgb(255, 255, 255)");
        assert.deepEqual(await page.evaluate(() => window.jsonViolations), []);
        assert.deepEqual(errors, []);
      });
    }
  }
}
