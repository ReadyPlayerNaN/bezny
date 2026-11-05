/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals, vitest/prefer-each -- Exercise shipped modal behavior in real Chromium with strict CSP. */
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
  new URL("../../../.tmp/scroll-lock/", import.meta.url)
);
await mkdir(scratch, { recursive: true });
const directory = await mkdtemp(path.join(scratch, "browser-"));
await build({
  build: {
    emptyOutDir: false,
    outDir: directory,
    rolldownOptions: {
      input: path.join(packageRoot, "test/scroll-lock-browser.html"),
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
  response.setHeader("X-Robots-Tag", "noindex, nofollow");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
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
  args: ["--no-sandbox", "--disable-features=OverlayScrollbar"],
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  headless: true,
  ignoreDefaultArgs: ["--hide-scrollbars"],
});
test.after(async () => {
  await browser.close();
  await server[Symbol.asyncDispose]();
});
const sample = (page) =>
  page.evaluate(() => {
    const probe = document
      .querySelector("#width-probe")
      .getBoundingClientRect();
    const header = document
      .querySelector("#fixed-header")
      .getBoundingClientRect();
    return {
      background: document.querySelector("#background-scroll").scrollTop,
      client: document.documentElement.clientWidth,
      headerLeft: header.left,
      headerWidth: header.width,
      left: probe.left,
      rootWidth: document.documentElement.getBoundingClientRect().width,
      scroll: scrollY,
      viewport: innerWidth,
      width: probe.width,
    };
  });
const assertLayout = (before, during, locked = false) => {
  for (const key of [
    "scroll",
    "rootWidth",
    "width",
    "left",
    "headerWidth",
    "headerLeft",
  ]) {
    assert.equal(during[key], before[key], `Changed ${key} while locked`);
  }
  // HTML clientWidth reports viewport width when the scrollbar is hidden;
  // physical root/content geometry must still retain its original gutter.
  assert.equal(during.client, locked ? during.viewport : before.client);
};
const checkPrimitive = async (page, trigger, popup, triggerRole = "button") => {
  await page.getByRole(triggerRole, { exact: true, name: trigger }).click();
  await expect(page.getByRole(popup)).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-bezny-scroll-locked",
    ""
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole(popup)).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-bezny-scroll-locked"
  );
};

for (const fixture of [
  { direction: "ltr", name: "classic scrollbar LTR", rootClass: "" },
  { direction: "rtl", name: "classic scrollbar RTL", rootClass: "" },
  {
    direction: "ltr",
    name: "existing two-edge gutter",
    rootClass: "both-gutters",
  },
  { direction: "ltr", name: "no scrollbar", rootClass: "short-document" },
]) {
  test(`preserves modal scroll locking without injected styles: ${fixture.name}`, async () => {
    const context = await browser.newContext({
      hasTouch: true,
      viewport: { height: 800, width: 1000 },
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(({ direction, rootClass }) => {
        window.scrollLockViolations = [];
        window.scrollLockInsertedStyles = 0;
        window.scrollLockWheels = [];
        window.scrollLockTouches = [];
        // Observe after all event listeners, not at a microtask checkpoint between callbacks.
        document.addEventListener("wheel", (event) =>
          setTimeout(
            () => window.scrollLockWheels.push(event.defaultPrevented),
            0
          )
        );
        document.addEventListener("touchmove", (event) =>
          setTimeout(
            () =>
              window.scrollLockTouches.push({
                cancelable: event.cancelable,
                prevented: event.defaultPrevented,
              }),
            0
          )
        );
        document.addEventListener("securitypolicyviolation", (event) =>
          window.scrollLockViolations.push(event.effectiveDirective)
        );
        document.addEventListener("DOMContentLoaded", () => {
          document.documentElement.dir = direction;
          document.documentElement.className = rootClass;
        });
        new MutationObserver((records) => {
          for (const record of records) {
            for (const node of record.addedNodes) {
              if (node instanceof Element) {
                window.scrollLockInsertedStyles +=
                  Number(node.tagName === "STYLE") +
                  node.querySelectorAll("style").length;
              }
            }
          }
        }).observe(document, { childList: true, subtree: true });
      }, fixture);
      const response = await page.goto(
        `${origin}/test/scroll-lock-browser.html`
      );
      assert.equal(response.status(), 200);
      assert.ok(
        !response.headers()["content-security-policy"].includes("unsafe-")
      );
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex, nofollow"
      );
      const row = page.locator('[data-selection-id="fixture-row"]');
      await expect(row).toBeVisible();
      await page.evaluate(() => scrollTo(0, 150));
      const before = await sample(page);
      if (fixture.rootClass === "short-document") {
        assert.equal(before.client, 1000);
      } else {
        assert.ok(
          before.client < 1000,
          "Classic scrollbar/gutter prerequisite missing"
        );
      }
      await row.focus();
      await row.press("Shift+F10");
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute(
        "data-bezny-scroll-locked",
        ""
      );
      await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
      assertLayout(before, await sample(page), true);
      if (fixture.rootClass === "short-document") {
        await expect(page.locator("html")).not.toHaveAttribute(
          "data-bezny-scrollbar-gutter"
        );
      }
      await page.mouse.move(650, 450);
      await page.mouse.wheel(0, 300);
      const background = await page.locator("#background-scroll").boundingBox();
      assert.ok(background);
      await page.mouse.move(background.x + 50, background.y + 50);
      await page.mouse.wheel(0, 300);
      await expect
        .poll(() => page.evaluate(() => window.scrollLockWheels.slice(0, 2)))
        .toEqual([true, true]);
      // A touch outside a context menu can dismiss it. Exercise containment at
      // the menu's top scroll boundary while it remains open instead.
      const touchBox = await menu.boundingBox();
      assert.ok(touchBox);
      const touch = await context.newCDPSession(page);
      const touchX = touchBox.x + touchBox.width / 2;
      const touchY = touchBox.y + 30;
      await touch.send("Input.dispatchTouchEvent", {
        touchPoints: [{ id: 1, x: touchX, y: touchY }],
        type: "touchStart",
      });
      await touch.send("Input.dispatchTouchEvent", {
        touchPoints: [{ id: 1, x: touchX, y: touchY + 60 }],
        type: "touchMove",
      });
      await touch.send("Input.dispatchTouchEvent", {
        touchPoints: [],
        type: "touchEnd",
      });
      await expect
        .poll(() => page.evaluate(() => window.scrollLockTouches))
        .toContainEqual({ cancelable: true, prevented: true });
      await touch.detach();
      await expect(menu).toBeVisible();
      assertLayout(before, await sample(page), true);
      const contained = await sample(page);
      assert.equal(contained.background, before.background);
      const box = await menu.boundingBox();
      assert.ok(box);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 100);
      await expect
        .poll(() => menu.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0);
      await menu.evaluate((element) => {
        element.scrollTop = 0;
      });
      await page
        .getByRole("menuitem", { exact: true, name: "Action 1" })
        .click();
      await expect(menu).toHaveCount(0);
      await expect(
        page.getByRole("status", { name: "Completed actions" })
      ).toHaveText("1");
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-bezny-scroll-locked"
      );
      await expect(row).toBeFocused();
      assertLayout(before, await sample(page));
      await page.mouse.move(background.x + 50, background.y + 50);
      await page.mouse.wheel(0, 300);
      await expect
        .poll(() =>
          page
            .locator("#background-scroll")
            .evaluate((element) => element.scrollTop)
        )
        .toBeGreaterThan(before.background);

      await row.click({ button: "right" });
      await expect(menu).toBeVisible();
      await page.mouse.click(650, 450);
      await expect(menu).toHaveCount(0);
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-bezny-scroll-locked"
      );

      await page
        .getByRole("button", { exact: true, name: "Open dialog" })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Nested lock" })
      ).toBeVisible();
      await page
        .getByRole("button", { exact: true, name: "Nested row" })
        .focus();
      await page.keyboard.press("Shift+F10");
      await expect(menu).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
      await expect(page.locator("html")).toHaveAttribute(
        "data-bezny-scroll-locked",
        ""
      );
      await expect(
        page.getByRole("button", { exact: true, name: "Nested row" })
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-bezny-scroll-locked"
      );
      await expect(
        page.getByRole("button", { exact: true, name: "Open dialog" })
      ).toBeFocused();

      await checkPrimitive(page, "Open dropdown", "menu");
      await checkPrimitive(page, "Open popover", "dialog");
      await checkPrimitive(page, "Choose item", "listbox", "combobox");
      await page
        .getByRole("button", { exact: true, name: "Modeless row" })
        .click({ button: "right" });
      await expect(menu).toBeVisible();
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-bezny-scroll-locked"
      );
      await page.keyboard.press("Escape");
      assert.deepEqual(errors, []);
      assert.deepEqual(
        await page.evaluate(() => window.scrollLockViolations),
        []
      );
      assert.equal(
        await page.evaluate(() => window.scrollLockInsertedStyles),
        0
      );
      await expect(page.locator("style")).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
}
