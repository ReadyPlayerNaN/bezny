import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  npmReleaseManifest,
  npmReleaseMetadata,
  prepareNpmPackages,
} from "./prepare-npm-packages.mjs";

const environment = {
  GITHUB_REPOSITORY: "ReadyPlayerNaN/bezny",
  GITHUB_SHA: "abcdef0123456789abcdef0123456789abcdef01",
  RELEASE_PRERELEASE: "false",
  RELEASE_TAG: "v1.2.3",
};
const metadata = npmReleaseMetadata(environment);
const readManifest = (library) =>
  JSON.parse(
    readFileSync(
      new URL(`../../packages/${library}/package.json`, import.meta.url),
      "utf-8"
    )
  );
const workflow = readFileSync(
  new URL("../workflows/npm-release.yml", import.meta.url),
  "utf-8"
);
const publishCommands = workflow
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.startsWith("npm publish "));
const localPublishPattern =
  /^npm publish \.\/tarballs\/bezny-(?:base|admin)-\*\.tgz /u;

test("stable and prerelease versions use latest and next respectively", () => {
  assert.equal(metadata.version, "1.2.3");
  assert.equal(metadata.tag, "latest");
  for (const suffix of ["alpha", "beta.0", "rc.12", "0", "0abc", "alpha-1"]) {
    const prerelease = npmReleaseMetadata({
      ...environment,
      RELEASE_PRERELEASE: "true",
      RELEASE_TAG: `v2.0.0-${suffix}`,
    });
    assert.equal(prerelease.version, `2.0.0-${suffix}`);
    assert.equal(prerelease.tag, "next");
  }
});

test("invalid tags and mismatched prerelease flags fail closed", () => {
  for (const tag of [
    undefined,
    "",
    "1.2.3",
    "v1.2",
    "v01.2.3",
    "v1.02.3",
    "v1.2.03",
    "v1.2.3+build",
    "v1.2.3-",
    "v1.2.3-rc..1",
    "v1.2.3-01",
    "v1.2.3-rc.01",
    "v1.2.3;echo bad",
  ]) {
    assert.throws(
      () => npmReleaseMetadata({ ...environment, RELEASE_TAG: tag }),
      /Release tag/u
    );
  }
  for (const prerelease of [undefined, "", "yes", "true"]) {
    assert.throws(
      () =>
        npmReleaseMetadata({ ...environment, RELEASE_PRERELEASE: prerelease }),
      /prerelease flag/u
    );
  }
  assert.throws(
    () => npmReleaseMetadata({ ...environment, RELEASE_TAG: "v1.2.3-rc.1" }),
    /prerelease flag/u
  );
  for (const key of ["GITHUB_REPOSITORY", "GITHUB_SHA"]) {
    assert.throws(
      () => npmReleaseMetadata({ ...environment, [key]: undefined }),
      /GitHub repository/u
    );
    assert.throws(
      () => npmReleaseMetadata({ ...environment, [key]: "../invalid" }),
      /GitHub repository/u
    );
  }
});

test("real public manifests retain exports and peers and pin the admin dependency", () => {
  for (const library of ["base", "admin"]) {
    const manifest = readManifest(library);
    const original = structuredClone(manifest);
    const release = npmReleaseManifest(manifest, library, metadata);
    assert.equal(release.name, `@bezny/${library}`);
    assert.equal(release.version, "1.2.3");
    assert.equal(release.private, false);
    assert.equal(release.scripts, undefined);
    assert.equal(release.devDependencies, undefined);
    assert.equal(release.gitHead, environment.GITHUB_SHA);
    assert.deepEqual(release.publishConfig, {
      access: "public",
      registry: "https://registry.npmjs.org",
      tag: "latest",
    });
    assert.deepEqual(release.repository, {
      directory: `packages/${library}`,
      type: "git",
      url: "git+https://github.com/ReadyPlayerNaN/bezny.git",
    });
    assert.deepEqual(release.exports, manifest.exports);
    assert.deepEqual(release.peerDependencies, manifest.peerDependencies);
    assert.deepEqual(release.files, manifest.files);
    if (library === "admin") {
      assert.equal(release.dependencies["@bezny/base"], "1.2.3");
    }
    assert.deepEqual(manifest, original);
    assert.equal(manifest.private, true);
  }
});

test("private packages and unpublished workspace dependencies cannot be released", () => {
  for (const library of ["demo", "typescript-config"]) {
    const manifest = readManifest(library);
    assert.equal(manifest.private, true);
    assert.throws(
      () => npmReleaseManifest(manifest, library, metadata),
      /Unexpected npm library/u
    );
    assert.throws(
      () => npmReleaseManifest(manifest, "base", metadata),
      /Unexpected npm library/u
    );
  }
  for (const section of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    for (const [name, version] of [
      ["@bezny/typescript-config", "workspace:*"],
      ["@bezny/demo", "1.0.0"],
      ["other-private-package", "workspace:*"],
    ]) {
      assert.throws(
        () =>
          npmReleaseManifest(
            { ...readManifest("base"), [section]: { [name]: version } },
            "base",
            metadata
          ),
        /Unpublished workspace dependency/u
      );
    }
    const release = npmReleaseManifest(
      { ...readManifest("admin"), [section]: { "@bezny/base": "workspace:*" } },
      "admin",
      metadata
    );
    assert.equal(release[section]["@bezny/base"], "1.2.3");
  }
});

const createReleaseFixture = async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), "bezny-npm-test-"));
  context.after(() => rm(root, { force: true, recursive: true }));
  for (const library of ["base", "admin"]) {
    const source = path.join(root, "packages", library);
    const manifest = readManifest(library);
    const files = new Set(["README.md", "unpublished.txt"]);
    // Include every declared entrypoint and every literal Sass file in the files list.
    for (const conditions of Object.values(manifest.exports)) {
      for (const file of typeof conditions === "string"
        ? [conditions]
        : Object.values(conditions)) {
        files.add(file);
      }
    }
    for (const file of manifest.files.filter((entry) => entry !== "dist")) {
      files.add(file);
    }
    for (const file of files) {
      const target = path.join(source, file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, "fixture\n");
    }
    writeFileSync(path.join(source, "package.json"), JSON.stringify(manifest));
  }
  return root;
};

test("workflow publishes only verified local tarballs without exposing the npm token to builds", () => {
  assert.match(workflow, /release:\s+types: \[published\]/u);
  assert.match(workflow, /needs: build/u);
  assert.equal(publishCommands.length, 2);
  for (const [index, command] of publishCommands.entries()) {
    assert.match(command, localPublishPattern);
    assert.ok(command.includes(`bezny-${["base", "admin"][index]}-*.tgz`));
    for (const flag of [
      "--registry=https://registry.npmjs.org",
      "--access=public",
      '--tag="$NPM_DIST_TAG"',
      "--ignore-scripts",
    ]) {
      assert.ok(command.includes(flag));
    }
  }
  const [buildJob, publishJob] = workflow.split("\n  publish:");
  assert.ok(!buildJob.includes("secrets.NPM_TOKEN"));
  // oxlint-disable-next-line no-template-curly-in-string -- GitHub Actions expression, not JavaScript interpolation.
  assert.ok(publishJob.includes("NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}"));
  assert.ok(!publishJob.includes("actions/checkout@"));
  assert.ok(!publishJob.includes("pnpm install"));
});

for (const prerelease of [false, true]) {
  test(`staged ${prerelease ? "prerelease" : "stable"} tarballs pass actual workflow publish dry runs`, async (context) => {
    const root = await createReleaseFixture(context);
    const destination = path.join(root, "release");
    const tarballs = path.join(root, "tarballs");
    await mkdir(tarballs);
    const release = prepareNpmPackages(root, destination, {
      ...environment,
      RELEASE_PRERELEASE: String(prerelease),
      RELEASE_TAG: prerelease ? "v1.2.3-rc.1" : "v1.2.3",
    });
    const stagedLibraries = await readdir(destination);
    assert.deepEqual(stagedLibraries.toSorted(), ["admin", "base"]);
    for (const library of ["base", "admin"]) {
      const target = path.join(destination, library);
      const [packed] = JSON.parse(
        execFileSync(
          "npm",
          [
            "pack",
            "--json",
            "--ignore-scripts",
            "--pack-destination",
            tarballs,
          ],
          { cwd: target, encoding: "utf-8", stdio: "pipe" }
        )
      );
      assert.equal(packed.name, `@bezny/${library}`);
      assert.equal(packed.version, release.version);
      assert.ok(!packed.files.some((file) => file.path === "unpublished.txt"));
      const staged = JSON.parse(
        readFileSync(path.join(target, "package.json"), "utf-8")
      );
      assert.equal(staged.publishConfig.tag, release.tag);
      assert.ok(!JSON.stringify(staged).includes("workspace:"));
      assert.ok(!JSON.stringify(staged).includes("npm.pkg.github.com"));
      for (const conditions of Object.values(staged.exports)) {
        for (const file of typeof conditions === "string"
          ? [conditions]
          : Object.values(conditions)) {
          assert.ok(
            packed.files.some((entry) => entry.path === file.slice(2)),
            `Missing export: ${file}`
          );
        }
      }
      if (library === "admin") {
        assert.equal(staged.dependencies["@bezny/base"], release.version);
      }
      assert.deepEqual(
        JSON.parse(
          readFileSync(
            path.join(root, "packages", library, "package.json"),
            "utf-8"
          )
        ),
        readManifest(library)
      );
    }
    for (const [index, command] of publishCommands.entries()) {
      const result = JSON.parse(
        execFileSync(
          "bash",
          [
            "--noprofile",
            "--norc",
            "-e",
            "-o",
            "pipefail",
            "-c",
            `${command} --dry-run --offline --json`,
          ],
          {
            cwd: root,
            encoding: "utf-8",
            env: { ...process.env, NPM_DIST_TAG: release.tag },
            stdio: "pipe",
          }
        )
      );
      const name = `@bezny/${["base", "admin"][index]}`;
      const published = result[name] ?? result;
      assert.equal(published.name, name);
      assert.equal(published.version, release.version);
    }
    assert.throws(() => prepareNpmPackages(root, destination, environment), {
      code: "EEXIST",
    });
  });
}

test("staging rejects missing build outputs and invalid metadata", async (context) => {
  const root = await createReleaseFixture(context);
  const destination = path.join(root, "release");
  assert.throws(
    () => prepareNpmPackages(root, destination, {}),
    /Release tag/u
  );
  await rm(path.join(root, "packages/base/dist"), { recursive: true });
  assert.throws(() => prepareNpmPackages(root, destination, environment), {
    code: "ENOENT",
  });
});
