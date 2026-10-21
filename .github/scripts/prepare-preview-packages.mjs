import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const githubRegistry = "https://npm.pkg.github.com";
const libraryNames = ["base", "admin"];
const repositoryPattern = /^[\w-]+\/[\w.-]+$/u;
const positiveIntegerPattern = /^[1-9]\d*$/u;
const commitPattern = /^[a-f\d]{40}$/u;

export const previewMetadata = (environment) => {
  const {
    GITHUB_REPOSITORY: repository,
    GITHUB_RUN_ID: runId,
    GITHUB_RUN_ATTEMPT: attempt,
    GITHUB_SHA: commit,
  } = environment;

  if (
    !repositoryPattern.test(repository ?? "") ||
    !positiveIntegerPattern.test(runId ?? "") ||
    !positiveIntegerPattern.test(attempt ?? "") ||
    !commitPattern.test(commit ?? "")
  ) {
    throw new Error(
      "Preview publishing requires valid GitHub repository, run, attempt, and commit metadata."
    );
  }

  return {
    commit,
    repository,
    scope: repository.split("/")[0].toLowerCase(),
    version: `0.0.0-nightly.${runId}.${attempt}.sha${commit.slice(0, 12)}`,
  };
};

export const previewManifest = (manifest, library, metadata) => {
  if (
    !libraryNames.includes(library) ||
    manifest.name !== `@bezny/${library}`
  ) {
    throw new Error(`Unexpected preview library: ${manifest.name}`);
  }

  const preview = {
    ...manifest,
    gitHead: metadata.commit,
    name: `@${metadata.scope}/bezny-${library}`,
    private: false,
    publishConfig: { registry: githubRegistry, tag: "nightly" },
    repository: {
      directory: `packages/${library}`,
      type: "git",
      url: `git+https://github.com/${metadata.repository}.git`,
    },
    version: metadata.version,
  };
  delete preview.scripts;
  delete preview.devDependencies;

  for (const section of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    if (!preview[section]) {
      continue;
    }
    preview[section] = { ...preview[section] };
    for (const [name, version] of Object.entries(preview[section])) {
      const dependency = libraryNames.find(
        (candidate) => name === `@bezny/${candidate}`
      );
      if (dependency) {
        // Keep the import name in JS/declarations, but resolve it from GitHub.
        preview[section][name] =
          `npm:@${metadata.scope}/bezny-${dependency}@${metadata.version}`;
      } else if (version.startsWith("workspace:")) {
        throw new Error(`Unpublished workspace dependency: ${name}`);
      }
    }
  }
  return preview;
};

export const preparePreviewPackages = (root, destination, environment) => {
  const metadata = previewMetadata(environment);
  // Refuse to reuse a staging directory so stale build files cannot be packed.
  mkdirSync(destination);
  for (const library of libraryNames) {
    const source = path.join(root, "packages", library);
    const target = path.join(destination, library);
    const manifest = JSON.parse(
      readFileSync(path.join(source, "package.json"), "utf-8")
    );
    const preview = previewManifest(manifest, library, metadata);
    mkdirSync(target);
    // Synchronous copying ensures a failed stage has no pending writes.
    // The package files lists are literal paths, not globs.
    for (const file of [...manifest.files, "README.md"]) {
      cpSync(path.join(source, file), path.join(target, file), {
        recursive: true,
      });
    }
    writeFileSync(
      path.join(target, "package.json"),
      `${JSON.stringify(preview, null, 2)}\n`
    );
  }
  return metadata;
};

if (import.meta.main) {
  const [destination] = process.argv.slice(2);
  if (!destination) {
    throw new Error(
      "Usage: node .github/scripts/prepare-preview-packages.mjs <staging-directory>"
    );
  }
  preparePreviewPackages(process.cwd(), destination, process.env);
}
