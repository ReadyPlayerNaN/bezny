import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";
import { build } from "vite";

const contentTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
};
const packageRoot = fileURLToPath(new URL("..", import.meta.url));

/** Serve a built public-package consumer under the production-style stylesheet CSP. */
export const startComponentBrowser = async (
  fixture,
  { root = packageRoot, spa = false } = {}
) => {
  const artifacts = fileURLToPath(
    new URL(`../../../.tmp/${fixture}/`, import.meta.url)
  );
  await mkdir(artifacts, { recursive: true });
  const directory = await mkdtemp(path.join(artifacts, "build-"));
  await build({
    build: {
      emptyOutDir: false,
      outDir: directory,
      rolldownOptions: {
        input: path.join(root, `test/${fixture}.html`),
      },
    },
    configFile: false,
    logLevel: "warn",
    root,
  });
  const server = createServer(async (request, response) => {
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
    );
    response.setHeader("X-Content-Type-Options", "nosniff");
    const { pathname } = new URL(request.url ?? "/", "http://127.0.0.1");
    const target = path.resolve(
      directory,
      spa && !path.extname(pathname) ? `test/${fixture}.html` : `.${pathname}`
    );
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
  try {
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
      headless: true,
    });
    return {
      artifacts,
      browser,
      close: async () => {
        try {
          await browser.close();
        } finally {
          await server[Symbol.asyncDispose]();
        }
      },
      url: `http://127.0.0.1:${address.port}/test/${fixture}.html`,
    };
  } catch (error) {
    await server[Symbol.asyncDispose]();
    throw error;
  }
};
