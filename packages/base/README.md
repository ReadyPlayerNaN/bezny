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

## Icons

`Icon` and `wrapIcon` are ported from `aipocapso`'s Lucide wrapper. They enforce `role="graphics-symbol"`, preserve SVG attributes, events, children, decorative `aria-hidden` semantics, and refs, and add no DOM wrapper. Ref forwarding uses React 19 ref props.

```tsx
import { Icon, wrapIcon } from "@bezny/base";
import { Plane } from "lucide-react";

const AirlineIcon = wrapIcon(Plane);

<Icon icon={Plane} aria-label="Airline" />;
<AirlineIcon aria-hidden="true" />;
```

The wrapper accepts any Lucide icon; this package does not copy the source application's domain-specific icon catalogue. Label meaningful icons or mark decorative ones `aria-hidden="true"`. Heading typography sizes their symbols.

## Buttons

`Button` and `Submit` are ported from `aipocapso` and use scoped SCSS modules. Import `@bezny/base/style.css` once for shared tokens and component styles.

```tsx
import { Button, Icon, Submit } from "@bezny/base";
import { Plane } from "lucide-react";

<Button variant="secondary" size="small">
  <Icon icon={Plane} aria-hidden="true" />
  Travel
</Button>;
<Submit loading>Save</Submit>;
<Button asComponent="a" href="#details">
  Details
</Button>;
```

- Variants: `primary` (default), `secondary`, and `critical`.
- Sizes: `normal` (default) and `small`; `fullWidth` expands the control.
- `disabled` and `loading` block interaction. Loading adds a decorative spinner, hides the label visually without changing its accessible name, and sets `aria-busy`.
- Native buttons default to `type="button"`. `type="submit"`, `submit`, and `Submit` support form submission; `type="reset"` is supported too.
- The source's legacy `type="secondary"` and `type="critical"` appearance aliases are retained. Prefer `variant` in new code.
- `asComponent` accepts an element or component and preserves its props and React 19 ref. Non-native controls receive button semantics, keyboard activation, and a focusable default tab index. Custom components must forward the provided props/ref.
- Disabled non-native controls are removed from tab order, suppress navigation, and stop click propagation. Focus rings and reduced-motion styling are included.

The default primary colour is blue (`#007eb0`), paired with white text. Primary, secondary, and critical hover/active colours are derived in the logical layer with CSS `color-mix(in srgb, …)`: hover mixes 90% of the foundational base with black, and active mixes 80%. Base colours, black, and the absolute mixing weights are foundational; interaction states are not.

Override foundational base colours on `:root` to update their derived states at runtime. Logical state tokens reference only foundational tokens, preserving adjacent-layer dependencies. The former foundational product/red hover/active tokens and cloud hover/dark tokens are removed; use the logical `color-<brand|neutral|danger>-<hover|active>` tokens for state-specific overrides. Browsers must support CSS `color-mix()`.

Button palette and sizing are represented through all four layers. Normal buttons use `1rem` text with `1.25rem` line height and a `2.5rem` minimum height; small buttons use `0.75rem`, `1rem`, and `2rem`, respectively. Automatic dark-mode tokens from the source application's full theme are not copied; the palette can be themed through Bezny's CSS tokens.

## Inputs and field presentation

**Inputs** are reusable RHF-unbound controls: `TextInput`, `TextareaInput`, `CheckboxInput`, `RadioGroupInput`, and `RadioInput`. They work without a form provider and accept native/Radix control props and React 19 refs. Checkbox and radio behavior comes from Radix; text entry uses native HTML controls.

`TextInput` adapts the source `InputField`'s control/prefix behavior without its label or feedback. It retains `minValue`/`maxValue` aliases and supports native `type` values. `TextareaInput` defaults to three rows. `CheckboxInput` supports controlled/uncontrolled and indeterminate states; `RadioInput` is used inside `RadioGroupInput` for roving focus, selection, and form values.

`FieldLabel` and `FieldFeedback` are reusable presentation components. A label uses `htmlFor`; for a radio group's accessible name, use `asComponent="span"` with an `id` and reference it through `aria-labelledby`. Required markers are decorative. Feedback supports `help`/`helpId` and `error`/`errorId`, with errors announced as alerts.

```tsx
<FieldLabel htmlFor="name" required>
  Name
</FieldLabel>;
<TextInput id="name" aria-describedby="name-help" />;
<FieldFeedback help="Use your full name" helpId="name-help" />;
```

All input and field presentation styles use scoped SCSS modules and the same four-layer token system. The source's typography is converted to `rem`.

## Styling

Styles use locally scoped SCSS module classes and the project's four-layer [SCSS token architecture](../../README.md#scss-token-architecture). Shared defaults are included in `@bezny/base/style.css`; control aliases are bound on each heading. Text color inherits from the surrounding interface.

- `src/tokens/_css-properties.scss` — pure CSS-name/reference functions and declaration mixins, inspired by [Bulma](https://github.com/jgthms/bulma/blob/main/sass/utilities/css-variables.scss).
- `src/tokens/_foundational.scss` — absolute sizes in `rem`, font family, and weight.
- `src/tokens/_logical.scss` — typography and icon scales referencing foundations.
- `src/tokens/_structural.scss` — heading purposes referencing logical scales.
- `src/content/heading-typography.scss` and `src/content/heading.module.scss` — heading control aliases and their usage.
- `src/controls/button-appearance.scss` and `src/controls/button.module.scss` — button control aliases, states, variants, and sizes.
- `src/tokens.scss` — shared `:root` defaults, included by the heading SCSS module.

| Heading level | Font size | Line height | Icon size |
| ------------- | --------- | ----------- | --------- |
| 1             | `3rem`    | `3.5rem`    | `3rem`    |
| 2             | `2.5rem`  | `3rem`      | `2.5rem`  |
| 3             | `2rem`    | `2.5rem`    | `1.75rem` |
| 4             | `1.5rem`  | `2rem`      | `1.5rem`  |
| 5             | `1.25rem` | `1.75rem`   | `1.25rem` |
| 6             | `1rem`    | `1.5rem`    | `1rem`    |

Headings use a rounded scale from `3rem` to `1rem`, without setting the root font size. Font family defaults to `sans-serif` and font weight to `700`. Icons with `role="graphics-symbol"` inside headings consume the heading icon-size control token.

Definition maps are the source of truth. Pure accessors such as `foundational.size(20)`, `logical.font-size("lg")`, and `structural.heading-font-size(3)` validate their keys and return runtime CSS references. Their declaration mixins emit matching properties separately; there is no global registration side effect.

Components consume exported Sass variables rather than handwritten CSS names:

```scss
@use "./src/content/heading-typography";

.heading {
  @include heading-typography.declarations;
  font-size: heading-typography.$font-size;
}
```

This compiles to `font-size: var(--bezny-control-heading-font-size)`, not a fixed Sass value. Unknown token keys, invalid heading levels, and missing Sass exports fail compilation. This is Bulma's separation of reference creation from declaration emission, extended with definition-map validation. The CSS names and four-layer alias chain remain unchanged.

Within this package, override shared tokens on `:root` after importing the stylesheet, using the declaration mixin and the preceding layer's accessor:

```scss
@use "./src/tokens/css-properties";
@use "./src/tokens/logical";

:root {
  @include css-properties.declarations(
    (
      "heading-3-font-size": logical.font-size("xl"),
    ),
    "structural"
  );
}
```

These Sass modules are currently internal source modules, not published package exports. Consumers of the built package can still theme its public CSS custom properties directly. Root defaults must be emitted even when only a Sass reference is consumed: returning `var()` does not emit its definition. Build tests check every CSS reference, the adjacent-layer chain, and each heading's scoped control declarations.

Other structural heading tokens follow `--bezny-structural-heading-<1–6>-<font-size|line-height|icon-size>`. Shared family and weight tokens are `--bezny-structural-heading-font-family` and `--bezny-structural-heading-font-weight`. Controls use `--bezny-control-heading-<font-size|line-height|icon-size|font-family|font-weight>`. Root aliases resolve where declared: descendant foundational or logical overrides do not automatically recompute the shared structural aliases. The old `--primitive-*`, `--semantic-color-text-strong`, and `--heading-icon-size` names have been replaced by this token chain.

## Development

```sh
pnpm --filter @bezny/base build
pnpm --filter @bezny/base typecheck
pnpm --filter @bezny/base test
```

Build first when running package tests directly. The root `pnpm test` builds automatically through Turbo. Builds emit `dist/index.js`, type declarations, source maps, and `dist/style.css`. React and its JSX runtime remain external; consumers supply React through the peer dependency.
