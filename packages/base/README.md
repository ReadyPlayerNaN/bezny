# @bezny/base

React UI primitives, built as an ESM library with Vite and SCSS modules.

## Usage

Add `"@bezny/base": "workspace:*"` to your application's dependencies and
install React 19. Import the stylesheet once in your application entry:

```tsx
import { Heading, Main, Section } from '@bezny/base';
import '@bezny/base/style.css';

export function Page() {
  return (
    <Main>
      <Heading>Page title</Heading>
      <Section>
        <Heading>Section title</Heading>
        <Section><Heading>Subsection title</Heading></Section>
      </Section>
    </Main>
  );
}
```

`Heading` defaults to `h1`. Each `Section` increases the inherited level,
up to `h6`. `Main` is a semantic wrapper and does not change the level.
`HeadingLevelProvider` can explicitly set a level or increment it automatically;
`useHeadingLevel` exposes the inherited level.

An explicit `level` takes precedence over `type` (`title1` through `title6`),
which takes precedence over the inherited level. Native HTML attributes,
children, and custom classes are forwarded.

## Styling

Styles use locally scoped SCSS module classes. The source typography and
`role="graphics-symbol"` icon sizing are preserved from
`../kiwi/aipocapso/packages/ui/src/controls/heading*`.

The original design-token names are supported, with standalone fallbacks:

| CSS custom property | Fallback |
| --- | --- |
| `--semantic-color-text-strong` | `inherit` |
| `--primitive-font-family-sans` | `sans-serif` |
| `--primitive-font-weight-bold` | `700` |
| `--primitive-font-size-400` | `20px` |
| `--primitive-line-height-400` | `28px` |

## Development

```sh
pnpm --filter @bezny/base build
pnpm --filter @bezny/base typecheck
pnpm --filter @bezny/base test
```

Build first when running package tests directly. The root `pnpm test` builds
automatically through Turbo. Builds emit `dist/index.js`, type declarations,
source maps, and `dist/style.css`. React and its JSX runtime remain external;
consumers supply React through the peer dependency.
