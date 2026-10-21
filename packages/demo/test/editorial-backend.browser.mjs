/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- Exercise real SharedWorkers and the production UI in Chromium. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { preview } from "vite";

const connectDevtools = async (url) => {
  const socket = new WebSocket(url);
  await once(socket, "open");
  const pending = new Map();
  let nextId = 0;
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    const request = pending.get(message.id);
    if (!request) {
      return;
    }
    pending.delete(message.id);
    clearTimeout(request.timeout);
    if (message.error) {
      request.reject(new Error(JSON.stringify(message.error)));
    } else {
      request.resolve(message.result);
    }
  });
  const send = (method, params, sessionId) => {
    nextId += 1;
    const id = nextId;
    const { promise, resolve, reject } = Promise.withResolvers();
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`DevTools timed out: ${method}`));
    }, 10_000);
    pending.set(id, { reject, resolve, timeout });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
    return promise;
  };
  return {
    close: () => {
      for (const request of pending.values()) {
        clearTimeout(request.timeout);
        request.reject(new Error("DevTools closed"));
      }
      pending.clear();
      socket.close();
    },
    send,
  };
};

const openPage = async (devtools) => {
  const { targetId } = await devtools.send("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await devtools.send("Target.attachToTarget", {
    flatten: true,
    targetId,
  });
  const send = (method, params) => devtools.send(method, params, sessionId);
  await send("Page.enable");
  const evaluate = async (expression) => {
    const response = await send("Runtime.evaluate", {
      awaitPromise: true,
      expression,
      returnByValue: true,
    });
    assert.equal(
      response.exceptionDetails,
      undefined,
      JSON.stringify(response.exceptionDetails)
    );
    return response.result.value;
  };
  const waitFor = async (expression) => {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      // oxlint-disable-next-line eslint/no-await-in-loop -- Poll the real browser until its async UI settles.
      if (await evaluate(expression)) {
        return;
      }
      // oxlint-disable-next-line eslint/no-await-in-loop -- Do not busy-spin the browser.
      await delay(50);
    }
    assert.fail(
      `Browser condition timed out: ${expression}\n${await evaluate("document.body.innerText")}`
    );
  };
  return { evaluate, send, targetId, waitFor };
};

const login = async (page) => {
  await page.waitFor(
    "[...document.querySelectorAll('button')].some(button => button.textContent === 'Continue with Google')"
  );
  await page.evaluate(
    "[...document.querySelectorAll('button')].find(button => button.textContent === 'Continue with Google').click()"
  );
  await page.waitFor(
    "document.querySelector('[aria-label=\"Account menu\"]') !== null"
  );
};

// Run after `pnpm --filter @bezny/demo build`; no automation dependency is needed.
test(
  "production SharedWorker shares edits across tabs, survives reload/disconnect, and reports unsupported browsers",
  { timeout: 60_000 },
  async (context) => {
    const directory = await mkdtemp(
      path.join(tmpdir(), "bezny-shared-worker-")
    );
    const server = await preview({
      configFile: false,
      preview: { host: "127.0.0.1", port: 0 },
      root: fileURLToPath(new URL("../", import.meta.url)),
    });
    const address = server.httpServer.address();
    const origin = `http://127.0.0.1:${address.port}`;
    const browser = spawn(
      process.env.CHROMIUM_PATH ?? "chromium",
      [
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--no-first-run",
        "--remote-debugging-port=0",
        `--user-data-dir=${directory}`,
        "about:blank",
      ],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
    let devtools;
    context.after(async () => {
      devtools?.close();
      if (
        browser.pid &&
        browser.exitCode === null &&
        browser.signalCode === null
      ) {
        const exited = once(browser, "exit");
        browser.kill();
        await exited;
      }
      server.httpServer.closeAllConnections();
      const closed = Promise.withResolvers();
      server.httpServer.close(closed.resolve);
      await closed.promise;
      await rm(directory, { force: true, recursive: true });
    });
    const endpoint = Promise.withResolvers();
    const startupTimeout = setTimeout(
      () => endpoint.reject(new Error("Chromium did not start")),
      10_000
    );
    let stderr = "";
    browser.on("error", endpoint.reject);
    browser.stderr.on("data", (data) => {
      stderr += data;
      const match = stderr.match(/DevTools listening on (?<url>ws:\/\/\S+)/u);
      if (match) {
        endpoint.resolve(match.groups.url);
      }
    });
    try {
      devtools = await connectDevtools(await endpoint.promise);
    } finally {
      clearTimeout(startupTimeout);
    }
    const first = await openPage(devtools);
    await first.send("Page.navigate", { url: `${origin}/articles` });
    await login(first);
    const second = await openPage(devtools);
    await second.send("Page.navigate", { url: `${origin}/articles/1` });
    await login(second);
    await second.waitFor(
      "document.querySelector('h1')?.textContent === 'Welcome to Bezny'"
    );

    // A full document navigation reconnects while the other tab keeps the worker alive.
    await first.send("Page.navigate", { url: `${origin}/articles/1/edit` });
    await first.waitFor("document.querySelector('input[name=title]') !== null");
    await first.evaluate(`(() => {
    const input = document.querySelector('input[name=title]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Shared worker edit');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('form').requestSubmit();
  })()`);
    await first.waitFor(
      "document.querySelector('h1')?.textContent === 'Shared worker edit'"
    );
    await second.waitFor(
      "document.querySelector('h1')?.textContent === 'Shared worker edit'"
    );
    await first.send("Page.reload");
    await first.waitFor(
      "document.querySelector('h1')?.textContent === 'Shared worker edit'"
    );
    assert.equal(await first.evaluate("sessionStorage.length"), 1);

    const targets = await devtools.send("Target.getTargets");
    assert.equal(
      targets.targetInfos.filter(
        (target) =>
          target.type === "shared_worker" &&
          target.url.includes("editorial-backend.worker")
      ).length,
      1
    );
    await devtools.send("Target.closeTarget", { targetId: first.targetId });
    assert.equal(
      await second.evaluate("document.querySelector('h1').textContent"),
      "Shared worker edit"
    );

    const third = await openPage(devtools);
    await third.send("Page.navigate", { url: `${origin}/articles/1` });
    await login(third);
    await third.waitFor(
      "document.querySelector('h1')?.textContent === 'Shared worker edit'"
    );

    const unsupported = await openPage(devtools);
    await unsupported.send("Page.addScriptToEvaluateOnNewDocument", {
      source:
        "Object.defineProperty(window, 'SharedWorker', { value: undefined })",
    });
    await unsupported.send("Page.navigate", { url: origin });
    await unsupported.waitFor(
      "document.querySelector('[role=alert]')?.textContent.includes('SharedWorker support')"
    );
  }
);
