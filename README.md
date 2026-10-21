# Bezny

Bezny is a UI framework for building admin interfaces.

Built with React and TypeScript in a Turborepo monorepo using pnpm workspaces.

## Component behavior architecture

Build Bezny's interactive components on top of **Radix Primitives** wherever an appropriate primitive exists. This is the framework's behavioral foundation, not a styling system.

- **Radix** provides interaction behavior: focus management, keyboard navigation, dismissal, portals, state management, and accessibility semantics where supported by the chosen primitive.
- **Bezny** owns the public component APIs, composition, SCSS modules, and the four-layer token system. Wrap primitives as Bezny components rather than exposing an unstyled dependency as the finished framework.
- **Native HTML** remains appropriate for straightforward headings, icons, and buttons. Do not introduce a Radix wrapper where it adds no behavior.

Use Radix for components such as dialogs, dropdown menus, popovers, selects, tabs, and tooltips instead of reimplementing their interaction machinery. Consider Radix Slot when implementing `asChild` composition; Slot merges props and refs but does not supply button behavior by itself.

Add individual Radix dependencies to the package that uses them when implementing that component, not preemptively. Preserve the primitive's accessibility contract and verify keyboard, focus, and state behavior through integration tests. This records the architectural direction; existing components are not automatically migrated by this documentation change.

## Forms

Use **React Hook Form** (`react-hook-form`) for form state, field registration, validation integration, and submission handling. It is a dependency of `@bezny/base`.

Use `register` for compatible native inputs and `Controller` or `useController` for controlled components, including Radix-based fields. Bezny owns field styling, labels, and error presentation; preserve accessible label and error associations. Radix owns supported control interactions, while React Hook Form owns form state.

### Inputs and fields

- **Inputs** are reusable, React Hook Form-unbound controls. They accept ordinary values/default values, change and blur handlers, refs, and accessibility props. They do not require a form context or own labels and validation feedback.
- **Fields** are React Hook Form-ready components that bind an input to form state and compose its label and feedback (including validation errors). They connect accessible labels, descriptions, invalid state, and RHF focus refs.

Use inputs outside RHF or when composing a custom field. Use fields inside an RHF form, with a `FormProvider` or an explicitly supplied `control`.

## SCSS token architecture

Bezny uses four layers of tokens, with dependencies flowing in one direction:

**Foundational → Logical → Structural → Control**

| Layer | Responsibility | References |
| --- | --- | --- |
| Foundational | Define primitive, absolute values. | No other tokens. |
| Logical | Group foundational primitives into a coherent system, such as a typography scale. | Foundational tokens only. |
| Structural | Give that system purpose, such as heading typography. | Logical tokens only. |
| Control | Apply purposeful values to individual components. | Structural tokens only. |

“Primitive tokens” means foundational tokens, not an additional layer. Do not skip layers, introduce reverse dependencies, or put raw design values in higher-layer tokens. Component styles consume control tokens. Use `rem` for typography, including font sizes, line heights, and related icon sizes.

> Structure cannot stand without its foundations. Logic is a foundation of function. Function is the essence of control

The implementation follows [Bulma's Sass/CSS-variable separation](https://github.com/jgthms/bulma/blob/main/sass/utilities/css-variables.scss): pure functions return runtime CSS references, while mixins emit declarations. Bezny additionally validates token keys against their definition maps. Components consume exported Sass variables containing CSS `var()` values, so runtime theming is preserved. Tests verify that referenced declarations are emitted and scoped correctly.

The stylesheet follows OS light/dark settings by default. Override with `.bezny-light` or `.bezny-dark` on `<html>` or a scoped wrapper; nested explicit themes rebind their token aliases. See [light and dark mode](packages/base/README.md#light-and-dark-mode) for usage and customisation.

The project-local [using-scss-tokens skill](.agents/skills/using-scss-tokens/SKILL.md) provides the implementation workflow.

## Requirements

- Node.js 24 or newer
- pnpm 10.34.5 (pinned in `package.json`)

## Getting started

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm test
```

## npm releases

Pushing a **version tag** (`v*`) runs [the npm release workflow](.github/workflows/npm-release.yml). After lint, packaging tests, builds, typechecks, and tests pass, it publishes **only `@bezny/base` and `@bezny/admin`** as public packages to `https://registry.npmjs.org`, base first. The root workspace, `@bezny/demo`, and `@bezny/typescript-config` are never published.

### Publish a version

1. Merge the desired changes, including the release workflow, before creating the release tag.
2. Create and push a new tag on the intended commit, for example `git tag -a v1.2.3 origin/master -m "Release v1.2.3"` then `git push origin refs/tags/v1.2.3`. The tag must be `vMAJOR.MINOR.PATCH`, optionally followed by a SemVer prerelease suffix; build metadata (`+...`) is not supported. No GitHub Release or local GitHub API credentials are required.
3. For a prerelease, use a tag such as `v1.3.0-rc.1`. The tag suffix alone selects npm's `next` dist-tag; stable tags select `latest`. Creating a GitHub Release is optional and does not trigger a second publish.
4. Wait for **Publish npm release packages** to succeed before installing both packages:

   ```sh
   pnpm add @bezny/base@1.2.3 @bezny/admin@1.2.3
   ```

The release tag is the version source for **both** packages, independent of the source manifests' development versions. CI stages built files into fresh directories, makes only those staged manifests public, removes development dependencies and lifecycle scripts, and pins admin's `@bezny/base` dependency to the exact release version. All source manifests remain private; no manual version bump or lockfile change is required for releasing.

### npm authentication and recovery

- For an existing tag that never triggered publishing (including `v0.1.0`, created before tag-triggered delivery), open **Actions → Publish npm release packages → Run workflow**, select **master**, and enter the existing tag in the **tag** input. This uses master's current workflow/packaging code but checks out, builds, and publishes the exact tagged source, recording the tag's commit rather than master's commit. It does not move or recreate the tag. With GitHub CLI authentication, the equivalent is `gh workflow run npm-release.yml --ref master -f tag=v0.1.0`. Changing the workflow does not retroactively trigger old tags.
- The separate publish job uses the repository secret **`NPM_TOKEN`** through `NODE_AUTH_TOKEN`. It does not check out source or install dependencies, and publishing disables lifecycle scripts. The build job never receives the npm token.
- The token must be an unexpired **granular npm access token** with read/write access to both packages (and permission to create them under the `@bezny` scope for the first release). Enable **bypass 2FA** for automated publishing, and ensure package/organization policies allow token-based publishing. Merely having the secret configured does not verify those permissions. See [npm's CI/CD authentication guidance](https://docs.npmjs.com/using-private-packages-in-a-ci-cd-workflow).
- Publish releases in version order and wait for each workflow to finish before starting the next. Publishing an older stable release also moves `latest` to that version.
- npm versions are immutable and the two publishes are not atomic. A retry is safe if neither package was published. If base succeeded but admin failed, fix the cause and publish only the missing admin tarball from that run's **npm-release-packages** artifact using an authenticated npm session: `npm publish ./bezny-admin-1.2.3.tgz --registry=https://registry.npmjs.org --access=public --tag=latest --ignore-scripts` (use the actual filename and `--tag=next` for prereleases). A full rerun will fail on the already-published base version. Alternatively, publish a new release version for both packages. Never replace a release tag to change an already-published version.
- Verified tarballs are retained for seven days. Test packaging locally without publishing using `node --test .github/scripts/*-tests.mjs`.

## GitHub preview packages

Every push to `master` runs [the preview workflow](.github/workflows/preview-packages.yml): lint, packaging tests, builds, typechecks, and tests must pass before publishing **only** the base and admin libraries to `https://npm.pkg.github.com`. This preview workflow does not publish to npmjs.org; npm delivery uses the separate release workflow above. The separate publish job uses the built-in `GITHUB_TOKEN` with `packages: write`; no npm token or personal publishing secret is needed.

GitHub requires package scopes to match the owning account, so this repository publishes `@readyplayernan/bezny-base` and `@readyplayernan/bezny-admin`. Source manifests remain private and retain their `@bezny/*` names. Staged packages use a matching version of the form `0.0.0-nightly.<run-id>.<attempt>.sha<commit-prefix>` and the `nightly` dist-tag (not `latest`). Admin's `@bezny/base` dependency is an npm alias pinned to that exact GitHub preview version. The package scope follows the repository owner if the repository moves.

### Install a preview

GitHub's npm registry requires authentication even for public packages. Create a personal access token **(classic)** with `read:packages` and access to both packages. Export it as `NODE_AUTH_TOKEN` in your shell or consumer CI, then add this to the consuming project's `.npmrc` (never commit the token itself):

```ini
@readyplayernan:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Install using aliases so the documented imports remain unchanged:

```sh
pnpm add '@bezny/base@npm:@readyplayernan/bezny-base@nightly' '@bezny/admin@npm:@readyplayernan/bezny-admin@nightly'
```

For reproducible testing, replace both `nightly` selectors with the **same exact version** from the workflow summary or GitHub Packages page. The two packages publish sequentially (base first), not atomically; wait for a successful workflow before installing. Overlapping runs can finish out of order, so `nightly` reflects publishing order, not necessarily commit order. React 19 and React DOM 19 remain consumer-provided peer dependencies.

### Repository administration

- GitHub Actions and package creation must be permitted by the repository/account policies. New packages are private by default; grant testers access to **both** packages or change their visibility in GitHub's package settings. Consumers in other Actions repositories need package read access explicitly granted before using their own `GITHUB_TOKEN`.
- If a package with the same name already exists, connect it to this repository and grant this repository Actions access before publishing.
- To retry a partially published run, choose **Re-run all jobs**. This builds a new version using the incremented attempt, avoiding immutable-version conflicts. Re-running only the failed publish job may encounter an already-published version.
- Verified tarballs are retained as workflow artifacts for seven days. Published GitHub package versions are not automatically deleted; manage their retention in GitHub Packages separately.
- To test the packaging logic locally without publishing: `node --test .github/scripts/prepare-preview-packages-tests.mjs`.

See [GitHub's npm registry documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) for authentication and permissions.

## Administration demo

```sh
pnpm --filter @bezny/demo dev
```

This builds `@bezny/base` and `@bezny/admin`, then starts the Vite demo server. Open the local URL printed in the terminal and sign in with `editor@example.com` / `bezny-demo`, or simulate Google/GitHub login. The header avatar menu provides profile editing, language selection, and logout. A SharedWorker simulates the backend, sharing in-memory records and sessions across same-origin tabs. Only an opaque mock token is stored per tab; sign-in can survive refresh while the worker remains alive. No application server is involved, and module SharedWorker support is required. Manage registered Articles and Pages through generic entity routes, registration-derived default CRUD pages, selection context, and one shared navigation/command catalog ([demo details](packages/demo/README.md)). Changes last for the worker's lifetime, not permanently; reloading one tab preserves them while another keeps the worker alive.

For a minimal host application, start with the [entity application quickstart](packages/admin/ENTITIES.md#minimal-entity-application).

## Structure

- `packages/admin/` — administration building-block foundation composing Jotai, TanStack Router, and `@bezny/base` ([usage and future requirements](packages/admin/README.md))
- `packages/base/` — React controls, RHF-bound fields, content components, and a responsive application shell, built with Vite and SCSS modules ([usage](packages/base/README.md), [component guide](packages/base/COMPONENTS.md))
- `packages/demo/` — private Vite editorial administration application consuming `@bezny/admin` and `@bezny/base`
- `packages/typescript-config/` — shared strict TypeScript configuration
- `turbo.json` — build, typecheck, and test pipelines

TypeScript 7.0.2 and Turborepo 2.11.7 are pinned in the workspace manifests. Some other dependencies use version ranges; `pnpm-lock.yaml` fixes resolved versions. Use `pnpm install --frozen-lockfile` for reproducible installs.

Add libraries under `packages/*`, each with its own `package.json`. Use `workspace:*` for internal dependencies and extend `@bezny/typescript-config/base.json` for shared compiler settings.

Builds emit JavaScript and declarations to `dist/`. Turbo caches build outputs; tests build their package first, and dependent packages build before typechecks.

Run a task for one package with, for example:

```sh
pnpm exec turbo run build --filter=@bezny/base
```
