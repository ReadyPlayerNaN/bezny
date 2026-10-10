/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- Validate published avatar composition, SSR and token bindings. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { Avatar, AvatarImage, AvatarFallback } from "@bezny/base";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compileString } from "sass";

test("published avatar safely renders fallback on the server before image loading", () => {
  const html = renderToStaticMarkup(
    createElement(
      Avatar,
      { size: "large" },
      createElement(AvatarImage, { alt: "Ada Lovelace", src: "/ada.png" }),
      createElement(
        AvatarFallback,
        { "aria-label": "Ada Lovelace", role: "img" },
        "AL"
      )
    )
  );
  assert.match(html, /data-size="large"/u);
  assert.match(html, /aria-label="Ada Lovelace"/u);
  assert.ok(html.includes("AL"));
  assert.ok(!html.includes("<img"));
});
test("avatar styles keep typography, sizes, shape and colours in adjacent token layers", () => {
  const css = readFileSync(
    new URL(import.meta.resolve("@bezny/base/style.css")),
    "utf-8"
  );
  const javascript = readFileSync(
    new URL(import.meta.resolve("@bezny/base")),
    "utf-8"
  );
  assert.match(
    css,
    /--bezny-control-avatar-size-normal:\s*var\(--bezny-structural-avatar-size-normal\)/u
  );
  assert.match(
    css,
    /--bezny-structural-avatar-font-size-normal:\s*var\(--bezny-logical-font-size-sm\)/u
  );
  assert.match(
    css,
    /--bezny-structural-avatar-radius:\s*var\(--bezny-logical-radius-round\)/u
  );
  assert.match(css, /--bezny-foundation-radius-round:\s*50%/u);
  assert.ok(javascript.includes('from "@radix-ui/react-avatar"'));
});
test("avatar control references are pure and reject misspelled tokens", () => {
  const options = {
    loadPaths: [fileURLToPath(new URL("../src", import.meta.url))],
  };
  assert.equal(
    compileString('@use "content/avatar-appearance";', options).css,
    ""
  );
  assert.throws(
    () =>
      compileString(
        '@use "content/avatar-appearance"; .avatar { width: avatar-appearance.token("missing-size"); }',
        options
      ),
    /Unknown control-avatar token: missing-size/u
  );
});
