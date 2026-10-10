/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- Measure CSS animations in actual Chromium. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { compileString } from "sass";

const { css } = compileString('@use "tokens"; @use "controls/dialog.module";', {
  loadPaths: [fileURLToPath(new URL("../src", import.meta.url))],
});
const sampleMotion = () => {
  const results = [];
  for (const node of document.querySelectorAll(".overlay, .content")) {
    const { transform } = getComputedStyle(node);
    for (const state of ["open", "closed"]) {
      node.dataset.state = state;
      const [animation] = node.getAnimations();
      if (animation) {
        animation.pause();
        animation.currentTime =
          Number(animation.effect.getTiming().duration) / 2;
      }
      const style = getComputedStyle(node);
      results.push({
        blur: style.backdropFilter,
        direction: node.dir,
        duration: style.animationDuration,
        kind: node.className,
        name: style.animationName,
        opacity: Number(style.opacity),
        placementPreserved: style.transform === transform,
        scale: style.scale,
        state,
      });
    }
  }
  return {
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    results,
  };
};

for (const reduced of [false, true]) {
  test(`modal panels and backdrops ${reduced ? "respect reduced motion" : "animate open and closed states"} in Chromium`, () => {
    const directory = mkdtempSync(path.join(tmpdir(), "bezny-modal-motion-"));
    try {
      const fixture = path.join(directory, "motion.html");
      writeFileSync(
        fixture,
        `<!doctype html><html><head><style>${css}</style></head><body><div class="overlay" data-state="open"></div><div class="content" dir="ltr" data-state="open">Modal</div><div class="content" dir="rtl" data-state="open">RTL modal</div><pre id="results"></pre><script>document.getElementById('results').textContent=JSON.stringify((${sampleMotion.toString()})());</script></body></html>`
      );
      const browser = spawnSync(
        process.env.CHROMIUM_PATH ?? "chromium",
        [
          "--headless",
          "--no-sandbox",
          "--disable-gpu",
          "--no-first-run",
          ...(reduced ? ["--force-prefers-reduced-motion"] : []),
          `--user-data-dir=${path.join(directory, "profile")}`,
          "--dump-dom",
          pathToFileURL(fixture).href,
        ],
        { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, timeout: 30_000 }
      );
      assert.ifError(browser.error);
      assert.equal(browser.status, 0, browser.stderr);
      const match = browser.stdout.match(
        /<pre id="results">(?<data>[^<]+)<\/pre>/u
      );
      assert.ok(match, browser.stdout);
      const samples = JSON.parse(match.groups.data);
      assert.equal(samples.reduced, reduced);
      assert.equal(samples.results.length, 6);
      for (const sample of samples.results) {
        assert.ok(sample.placementPreserved, JSON.stringify(sample));
        if (sample.kind === "overlay") {
          assert.equal(sample.blur, "blur(8px)");
        }
        if (reduced) {
          assert.equal(sample.name, "none");
          assert.equal(sample.opacity, sample.state === "open" ? 1 : 0);
        } else {
          assert.equal(
            sample.name,
            `${sample.kind === "overlay" ? "backdrop" : "dialog"}-${sample.state === "open" ? "enter" : "exit"}`
          );
          assert.equal(
            sample.duration,
            sample.state === "open" ? "0.2s" : "0.12s"
          );
          assert.ok(
            sample.opacity > 0 && sample.opacity < 1,
            JSON.stringify(sample)
          );
          if (sample.kind === "content") {
            assert.ok(
              Number(sample.scale) > 0.96 && Number(sample.scale) < 1,
              JSON.stringify(sample)
            );
          }
        }
      }
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
}
