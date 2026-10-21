import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  preparePreviewPackages,
  previewManifest,
  previewMetadata,
} from "./prepare-preview-packages.mjs";

const { join } = path;
const environment = {
  GITHUB_REPOSITORY: "ReadyPlayerNaN/bezny",
  GITHUB_RUN_ATTEMPT: "1",
  GITHUB_RUN_ID: "123456",
  GITHUB_SHA: "abcdef0123456789abcdef0123456789abcdef01",
};
const metadata = previewMetadata(environment);
const baseManifest = {
  devDependencies: { "@bezny/typescript-config": "workspace:*" },
  exports: {
    // oxlint-disable-next-line sort-keys -- Conditional exports must put types first.
    ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
    "./style.css": "./dist/style.css",
    "./viewports": { sass: "./src/tokens/_viewports.scss" },
  },
  files: ["dist", "src/tokens/_viewports.scss"],
  name: "@bezny/base",
  peerDependencies: { react: "^19.0.0" },
  private: true,
  scripts: { build: "vite build", prepublishOnly: "exit 1" },
  type: "module",
  version: "0.0.0",
};

test("preview versions identify the commit and distinguish workflow reruns", () => {
  assert.equal(metadata.scope, "readyplayernan");
  assert.equal(metadata.version, "0.0.0-nightly.123456.1.shaabcdef012345");
  // Numeric-only SHA prefixes must not become invalid leading-zero SemVer identifiers.
  assert.equal(
    previewMetadata({ ...environment, GITHUB_SHA: "0".repeat(40) }).version,
    "0.0.0-nightly.123456.1.sha000000000000"
  );
  assert.notEqual(
    previewMetadata({ ...environment, GITHUB_RUN_ATTEMPT: "2" }).version,
    metadata.version
  );
  assert.notEqual(
    previewMetadata({ ...environment, GITHUB_RUN_ID: "123457" }).version,
    metadata.version
  );
});

test("missing or malformed GitHub metadata fails before staging", () => {
  for (const key of Object.keys(environment)) {
    assert.throws(
      () => previewMetadata({ ...environment, [key]: undefined }),
      /valid GitHub/u
    );
    assert.throws(
      () => previewMetadata({ ...environment, [key]: "../invalid" }),
      /valid GitHub/u
    );
  }
});

test("preview manifests preserve exports and peers without changing workspace manifests", () => {
  const original = structuredClone(baseManifest);
  const preview = previewManifest(baseManifest, "base", metadata);
  assert.equal(preview.name, "@readyplayernan/bezny-base");
  assert.equal(preview.version, metadata.version);
  assert.equal(preview.private, false);
  assert.deepEqual(preview.exports, baseManifest.exports);
  assert.deepEqual(preview.peerDependencies, baseManifest.peerDependencies);
  assert.equal(preview.scripts, undefined);
  assert.equal(preview.devDependencies, undefined);
  assert.deepEqual(preview.publishConfig, {
    registry: "https://npm.pkg.github.com",
    tag: "nightly",
  });
  assert.deepEqual(preview.repository, {
    directory: "packages/base",
    type: "git",
    url: "git+https://github.com/ReadyPlayerNaN/bezny.git",
  });
  assert.equal(preview.gitHead, environment.GITHUB_SHA);
  assert.deepEqual(baseManifest, original);
});

test("admin resolves its unchanged base imports to the exact matching GitHub version", () => {
  const manifest = {
    ...baseManifest,
    dependencies: { "@bezny/base": "workspace:*", jotai: "3.0.1" },
    name: "@bezny/admin",
  };
  const preview = previewManifest(manifest, "admin", metadata);
  assert.equal(preview.name, "@readyplayernan/bezny-admin");
  assert.deepEqual(preview.dependencies, {
    "@bezny/base": `npm:@readyplayernan/bezny-base@${metadata.version}`,
    jotai: "3.0.1",
  });
  assert.equal(manifest.dependencies["@bezny/base"], "workspace:*");
});

test("unpublished libraries and unresolved workspace dependencies are rejected", () => {
  assert.throws(
    () => previewManifest(baseManifest, "demo", metadata),
    /Unexpected preview library/u
  );
  for (const section of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    assert.throws(
      () =>
        previewManifest(
          { ...baseManifest, [section]: { "@bezny/unknown": "workspace:*" } },
          "base",
          metadata
        ),
      /Unpublished workspace dependency/u
    );
  }
});

const createLibraryFixture = async (root, library) => {
  const directory = join(root, "packages", library);
  await mkdir(join(directory, "dist"), { recursive: true });
  await mkdir(join(directory, "src/tokens"), { recursive: true });
  await writeFile(
    join(directory, "package.json"),
    JSON.stringify({ ...baseManifest, name: `@bezny/${library}` })
  );
  await writeFile(
    join(directory, "dist/index.js"),
    "export const preview = true;\n"
  );
  await writeFile(
    join(directory, "dist/index.d.ts"),
    "export declare const preview: boolean;\n"
  );
  await writeFile(join(directory, "dist/style.css"), ":root {}\n");
  await writeFile(
    join(directory, "src/tokens/_viewports.scss"),
    "$viewport: 1rem;\n"
  );
  await writeFile(join(directory, "README.md"), "# Preview fixture\n");
  await writeFile(join(directory, "not-for-publication.txt"), "not shipped\n");
};

test("staged packages pack JS, declarations, CSS, Sass, and README without workspace-only files", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "bezny-preview-test-"));
  context.after(() => rm(root, { force: true, recursive: true }));
  await Promise.all(
    ["base", "admin"].map((library) => createLibraryFixture(root, library))
  );
  const destination = join(root, "preview");
  preparePreviewPackages(root, destination, environment);
  for (const library of ["base", "admin"]) {
    const target = join(destination, library);
    const packed = JSON.parse(
      execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
        cwd: target,
        encoding: "utf-8",
      })
    );
    assert.equal(packed[0].name, `@readyplayernan/bezny-${library}`);
    assert.deepEqual(packed[0].files.map((file) => file.path).toSorted(), [
      "README.md",
      "dist/index.d.ts",
      "dist/index.js",
      "dist/style.css",
      "package.json",
      "src/tokens/_viewports.scss",
    ]);
    const source = JSON.parse(
      readFileSync(join(root, "packages", library, "package.json"), "utf-8")
    );
    assert.equal(source.private, true);
    assert.equal(source.version, "0.0.0");
  }
  assert.throws(() => preparePreviewPackages(root, destination, environment), {
    code: "EEXIST",
  });
});

test("staging fails when a declared build output is missing", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "bezny-preview-missing-"));
  context.after(() => rm(root, { force: true, recursive: true }));
  await Promise.all(
    ["base", "admin"].map((library) => createLibraryFixture(root, library))
  );
  await rm(join(root, "packages/base/dist"), { recursive: true });
  assert.throws(
    () => preparePreviewPackages(root, join(root, "preview"), environment),
    { code: "ENOENT" }
  );
});
