# Bezny

Minimal TypeScript + Turborepo monorepo using pnpm workspaces.

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

## Structure

- `packages/core/` — starter ESM TypeScript library with a smoke test
- `packages/typescript-config/` — shared strict TypeScript configuration
- `turbo.json` — build, typecheck, and test pipelines

TypeScript 7.0.2 and Turborepo 2.11.7 were the npm `latest` releases at
initialization. Dependencies and the lockfile are pinned for reproducibility.

Add libraries under `packages/*`, each with
its own `package.json`. Use `workspace:*` for internal dependencies and extend
`@bezny/typescript-config/base.json` for shared compiler settings.

Builds emit JavaScript and declarations to `dist/`. Turbo caches build outputs;
tests build their package first, and dependent packages build before typechecks.

Run a task for one package with, for example:

```sh
pnpm exec turbo run build --filter=@bezny/core
```
