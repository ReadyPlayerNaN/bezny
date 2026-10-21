import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const libraryNames = ["base", "admin"];
const releaseTagPattern =
  /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?<prerelease>[\da-zA-Z.-]+))?$/u;
const prereleaseIdentifierPattern =
  /^(?:0|[1-9]\d*|\d*[a-zA-Z-][\da-zA-Z-]*)$/u;
const repositoryPattern = /^[\w-]+\/[\w.-]+$/u;
const commitPattern = /^[a-f\d]{40}$/u;

export const npmReleaseMetadata = (environment) => {
  const {
    GITHUB_REPOSITORY: repository,
    GITHUB_SHA: commit,
    RELEASE_TAG: releaseTag,
    RELEASE_PRERELEASE: prerelease,
  } = environment;
  const match = releaseTagPattern.exec(releaseTag ?? "");
  if (
    !match ||
    (match.groups.prerelease &&
      !match.groups.prerelease
        .split(".")
        .every((identifier) => prereleaseIdentifierPattern.test(identifier)))
  ) {
    throw new Error(
      "Release tag must be vMAJOR.MINOR.PATCH with an optional SemVer prerelease (no build metadata)."
    );
  }
  if (
    !["true", "false"].includes(prerelease) ||
    (prerelease === "true") !== Boolean(match.groups.prerelease)
  ) {
    throw new Error(
      "GitHub's prerelease flag must match the release tag's prerelease suffix."
    );
  }
  if (
    !repositoryPattern.test(repository ?? "") ||
    !commitPattern.test(commit ?? "")
  ) {
    throw new Error(
      "npm publishing requires valid GitHub repository and commit metadata."
    );
  }
  return {
    commit,
    repository,
    tag: prerelease === "true" ? "next" : "latest",
    version: releaseTag.slice(1),
  };
};

export const npmReleaseManifest = (manifest, library, metadata) => {
  if (
    !libraryNames.includes(library) ||
    manifest.name !== `@bezny/${library}`
  ) {
    throw new Error(`Unexpected npm library: ${manifest.name}`);
  }
  const release = {
    ...manifest,
    gitHead: metadata.commit,
    private: false,
    publishConfig: {
      access: "public",
      registry: "https://registry.npmjs.org",
      tag: metadata.tag,
    },
    repository: {
      directory: `packages/${library}`,
      type: "git",
      url: `git+https://github.com/${metadata.repository}.git`,
    },
    version: metadata.version,
  };
  delete release.scripts;
  delete release.devDependencies;
  for (const section of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    if (!release[section]) {
      continue;
    }
    release[section] = { ...release[section] };
    for (const [name, version] of Object.entries(release[section])) {
      if (libraryNames.some((candidate) => name === `@bezny/${candidate}`)) {
        release[section][name] = metadata.version;
      } else if (
        name.startsWith("@bezny/") ||
        version.startsWith("workspace:")
      ) {
        throw new Error(`Unpublished workspace dependency: ${name}`);
      }
    }
  }
  return release;
};

export const prepareNpmPackages = (root, destination, environment) => {
  const metadata = npmReleaseMetadata(environment);
  // Stage only the two public libraries; leave every source manifest private.
  // A fresh destination prevents stale output from a previous release leaking in.
  mkdirSync(destination);
  for (const library of libraryNames) {
    const source = path.join(root, "packages", library);
    const target = path.join(destination, library);
    const manifest = JSON.parse(
      readFileSync(path.join(source, "package.json"), "utf-8")
    );
    const release = npmReleaseManifest(manifest, library, metadata);
    mkdirSync(target);
    for (const file of [...manifest.files, "README.md"]) {
      cpSync(path.join(source, file), path.join(target, file), {
        recursive: true,
      });
    }
    writeFileSync(
      path.join(target, "package.json"),
      `${JSON.stringify(release, null, 2)}\n`
    );
  }
  return metadata;
};

if (import.meta.main) {
  const [destination] = process.argv.slice(2);
  if (!destination) {
    throw new Error(
      "Usage: node .github/scripts/prepare-npm-packages.mjs <staging-directory>"
    );
  }
  prepareNpmPackages(process.cwd(), destination, process.env);
}
