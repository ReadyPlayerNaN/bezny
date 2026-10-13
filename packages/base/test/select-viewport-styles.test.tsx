import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  externalSelectViewportStyles,
  transformSelectViewportStyles,
} from "../select-viewport-styles.js";

const require = createRequire(import.meta.url);
const id = path.join(
  path.dirname(require.resolve("@radix-ui/react-select")),
  "index.mjs"
);
const original = readFileSync(id, "utf-8");

describe("Radix Select external viewport styles", () => {
  it("removes only the pinned static stylesheet, preserving the original viewport", () => {
    const result = transformSelectViewportStyles(original, id);
    expect(result).not.toBeNull();
    expect(result?.code).not.toContain("dangerouslySetInnerHTML");
    expect(result?.code).toContain("ref: composedRefs");
    expect(result?.code).toContain(
      "onScroll: composeEventHandlers(viewportProps.onScroll"
    );
    expect(result?.code).toContain('"data-radix-select-viewport": ""');
  });

  it("maps the transform back to the unchanged source and runs before bundling", () => {
    const result = transformSelectViewportStyles(original, id);
    expect(result?.map.sources).toStrictEqual([id]);
    expect(result?.map.sourcesContent).toStrictEqual([original]);
    expect(result?.map.mappings.length).toBeGreaterThan(0);
    expect(externalSelectViewportStyles().enforce).toBe("pre");
  });

  it("fails closed on stylesheet drift or duplicate matches instead of guessing", () => {
    expect(() =>
      transformSelectViewportStyles(
        original.replace("scrollbar-width:none", "scrollbar-width:auto"),
        id
      )
    ).toThrow("Pinned Radix Select viewport stylesheet changed");
    expect(() =>
      transformSelectViewportStyles(original + original, id)
    ).toThrow("Pinned Radix Select viewport stylesheet changed");
  });

  it("does not transform other dependency modules or similarly named application files", () => {
    expect(
      transformSelectViewportStyles(original, "/app/select.tsx")
    ).toBeNull();
    expect(
      transformSelectViewportStyles(
        original,
        id.replaceAll("react-select", "react-context-menu")
      )
    ).toBeNull();
  });
});
