# Bezny

Bezny is a UI framework for building admin interfaces.

Built with React and TypeScript in a Turborepo monorepo using pnpm workspaces.

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

## Structure

- `packages/base/` — React heading primitives, built with Vite and SCSS modules ([usage](packages/base/README.md))
- `packages/typescript-config/` — shared strict TypeScript configuration
- `turbo.json` — build, typecheck, and test pipelines

TypeScript 7.0.2 and Turborepo 2.11.7 were the npm `latest` releases at initialization. Dependencies and the lockfile are pinned for reproducibility.

Add libraries under `packages/*`, each with its own `package.json`. Use `workspace:*` for internal dependencies and extend `@bezny/typescript-config/base.json` for shared compiler settings.

Builds emit JavaScript and declarations to `dist/`. Turbo caches build outputs; tests build their package first, and dependent packages build before typechecks.

Run a task for one package with, for example:

```sh
pnpm exec turbo run build --filter=@bezny/base
```
