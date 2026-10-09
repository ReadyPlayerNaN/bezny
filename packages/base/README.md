# @bezny/base

React UI primitives, built as an ESM library with Vite and SCSS modules.

## Usage

Add `"@bezny/base": "workspace:*"` to your application's dependencies and install React 19. Import the stylesheet once in your application entry:

```tsx
import { Heading, Main, Section } from "@bezny/base";

import "@bezny/base/style.css";

export function Page() {
  return (
    <Main>
      <Heading>Page title</Heading>
      <Section>
        <Heading>Section title</Heading>
        <Section>
          <Heading>Subsection title</Heading>
        </Section>
      </Section>
    </Main>
  );
}
```

`Heading` defaults to `h1`. Each `Section` increases the inherited level, up to `h6`. `Main` is a semantic wrapper and does not change the level. `HeadingLevelProvider` can explicitly set a level or increment it automatically; `useHeadingLevel` exposes the inherited level.

An explicit `level` takes precedence over the inherited level. Native HTML attributes, children, and custom classes are forwarded.

## Styling

Styles use locally scoped SCSS module classes and the project's four-layer [SCSS token architecture](../../README.md#scss-token-architecture). Shared defaults are included in `@bezny/base/style.css`; control aliases are bound on each heading. Text color inherits from the surrounding interface.

- `src/tokens/_foundational.scss` — absolute sizes in `rem`, font family, and weight.
- `src/tokens/_logical.scss` — typography and icon scales referencing foundations.
- `src/tokens/_structural.scss` — heading purposes referencing logical scales.
- `src/content/heading-typography.scss` and `src/content/heading.module.scss` — component control aliases and their usage.
- `src/tokens.scss` — shared `:root` defaults, included by the heading SCSS module.

| Heading level | Font size  | Line height | Icon size  |
| ------------- | ---------- | ----------- | ---------- |
| 1             | `2rem`     | `2.5rem`    | `1.75rem`  |
| 2             | `1.5rem`   | `2rem`      | `1.5rem`   |
| 3             | `1.25rem`  | `1.75rem`   | `1.25rem`  |
| 4             | `1.125rem` | `1.5rem`    | `1.125rem` |
| 5             | `1rem`     | `1.5rem`    | `1rem`     |
| 6             | `0.875rem` | `1.25rem`   | `0.875rem` |

These preserve the original proportions at a reference root size of 16px, without setting the root font size. Font family defaults to `sans-serif` and font weight to `700`. Icons with `role="graphics-symbol"` inside headings consume the heading icon-size control token.

Token names are namespaced by layer:

```scss
// Defaults: foundation → logical → structural → control.
// --bezny-foundation-size-20: 1.25rem;
// --bezny-logical-font-size-lg: var(--bezny-foundation-size-20);
// --bezny-structural-heading-3-font-size: var(--bezny-logical-font-size-lg);
// --bezny-control-heading-font-size: var(--bezny-structural-heading-3-font-size);
```

For a theme, override shared tokens on `:root` after importing the package stylesheet. Keep references to the preceding layer:

```scss
:root {
  --bezny-structural-heading-3-font-size: var(--bezny-logical-font-size-xl);
}
```

Other structural heading tokens follow `--bezny-structural-heading-<1–6>-<font-size|line-height|icon-size>`. Shared family and weight tokens are `--bezny-structural-heading-font-family` and `--bezny-structural-heading-font-weight`. Controls use `--bezny-control-heading-<font-size|line-height|icon-size|font-family|font-weight>`. Root aliases resolve where declared: descendant foundational or logical overrides do not automatically recompute the shared structural aliases. The old `--primitive-*`, `--semantic-color-text-strong`, and `--heading-icon-size` names have been replaced by this token chain.

## Development

```sh
pnpm --filter @bezny/base build
pnpm --filter @bezny/base typecheck
pnpm --filter @bezny/base test
```

Build first when running package tests directly. The root `pnpm test` builds automatically through Turbo. Builds emit `dist/index.js`, type declarations, source maps, and `dist/style.css`. React and its JSX runtime remain external; consumers supply React through the peer dependency.
