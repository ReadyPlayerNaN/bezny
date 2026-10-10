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

## Administration demo

```sh
pnpm --filter @bezny/demo dev
```

This builds `@bezny/base` and `@bezny/admin`, then starts the Vite demo server. Open the local URL printed in the terminal and sign in with `editor@example.com` / `bezny-demo`, or simulate Google/GitHub login. The header avatar menu provides profile editing, language selection, and logout. Authentication is demo-only; a backend-issued session token preserves sign-in across refresh until logout, expiry, or closing the tab. Manage registered Articles and Pages through generic entity routes, customized admin pages, selection context, and one shared navigation/command catalog ([demo details](packages/demo/README.md)). Changes are kept in memory and reset on reload.

## Structure

- `packages/admin/` — administration building-block foundation composing Jotai, TanStack Router, and `@bezny/base` ([usage and future requirements](packages/admin/README.md))
- `packages/base/` — React headings, Lucide icon wrappers, and buttons, built with Vite and SCSS modules ([usage](packages/base/README.md))
- `packages/demo/` — private Vite editorial administration application consuming `@bezny/admin` and `@bezny/base`
- `packages/typescript-config/` — shared strict TypeScript configuration
- `turbo.json` — build, typecheck, and test pipelines

TypeScript 7.0.2 and Turborepo 2.11.7 were the npm `latest` releases at initialization. Dependencies and the lockfile are pinned for reproducibility.

Add libraries under `packages/*`, each with its own `package.json`. Use `workspace:*` for internal dependencies and extend `@bezny/typescript-config/base.json` for shared compiler settings.

Builds emit JavaScript and declarations to `dist/`. Turbo caches build outputs; tests build their package first, and dependent packages build before typechecks.

Run a task for one package with, for example:

```sh
pnpm exec turbo run build --filter=@bezny/base
```
