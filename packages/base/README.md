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

`Icon` and `wrapIcon` enforce `role="graphics-symbol"` and require a label. Link visible text with `aria-labelledby` (the standard spelling), or supply `aria-label` to show a Radix tooltip popup on hover and keyboard focus. SVG props and React 19 refs are preserved; visible-label icons add no DOM wrapper.

```tsx
import { Icon, wrapIcon } from "@bezny/base";
import { Plane } from "lucide-react";

const AirlineIcon = wrapIcon(Plane);

<Icon icon={Plane} aria-label="Airline" />;
<span id="airline-label">Airline</span>;
<AirlineIcon aria-labelledby="airline-label" />;
```

Every icon needs one of these label paths, including decorative indicators. `aria-hidden="true"` may prevent duplicate announcements inside an already-labelled control, but is not a substitute for a label association. Heading typography sizes its symbols. `wrapIcon` retains the same required label API.

## Buttons

`Button` and `Submit` are ported from `aipocapso` and use scoped SCSS modules. Import `@bezny/base/style.css` once for shared tokens and component styles.

```tsx
import { Button, Icon, Submit } from "@bezny/base";
import { Plane } from "lucide-react";

<Button variant="secondary" size="small">
  <Icon icon={Plane} aria-labelledby="travel-label" aria-hidden="true" />
  <span id="travel-label">Travel</span>
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

The default primary colour is blue (`#007eb0`), paired with white text in both modes. Hover/active colours are derived in the logical layer with CSS `color-mix(in srgb, …)`: hover retains 90% of the foundational base and active retains 80%. Light-mode states mix with black; dark-mode secondary states mix with white. Primary and critical states continue darkening in dark mode to preserve white-label contrast. Base colours and absolute mixing weights are foundational; interaction states are not.

Override foundational base colours on `:root` to update their derived states at runtime. Logical state tokens reference only foundational tokens, preserving adjacent-layer dependencies. The former foundational product/red hover/active tokens and cloud hover/dark tokens are removed; use the logical `color-<brand|neutral|danger>-<hover|active>` tokens for state-specific overrides. Browsers must support CSS `color-mix()`.

Button palette and sizing are represented through all four layers. Normal buttons use `1rem` text with `1.25rem` line height and a `2.5rem` minimum height; small buttons use `0.75rem`, `1rem`, and `2rem`, respectively. Both light and dark palettes can be themed through Bezny's CSS tokens.

See [composed components](COMPONENTS.md) for Select and additional interactive/content components.

### Icon buttons

```tsx
import { IconButton } from "@bezny/base";
import { Plane } from "lucide-react";

<IconButton icon={Plane} aria-label="Book travel" variant="secondary" />;
```

`IconButton` is a native, circular `Button` with fixed `2.5rem` width/height, no padding, and a `1rem` icon. It forwards button props, events, and refs, including disabled/loading states. Use `aria-label` for a hover/focus popup or `aria-labelledby` for visible page text. The button—not a nested SVG—is the focusable popup trigger. It intentionally has no `size`, `fullWidth`, or polymorphic API.

Geometry follows the four-layer token chain: `--bezny-control-button-icon-button-<size|icon-size|radius>` consumes `--bezny-structural-icon-button-<size|icon-size|radius>`. The size/radius resolve through logical normal control height; the icon size uses the logical small icon scale.

### Filter buttons

`FilterBadge` and filter picker triggers use pill-shaped corners with a full-height `2.5rem` radius and compact `0.5rem` inline padding (half the normal button padding). Filter panels retain their existing radius and padding. The scoped `--bezny-control-filter-button-<radius|padding>` aliases reference `--bezny-structural-filter-button-<radius|padding>`, which use logical normal control height and small spacing respectively.

## Inputs and fields

**Inputs** are reusable RHF-unbound controls: `TextInput`, `TextareaInput`, `CheckboxInput`, `RadioGroupInput`, `RadioInput`, and `ToggleInput`. They work without a form provider and accept native/Radix control props and React 19 refs. Checkbox, radio, and toggle behavior comes from Radix; text entry uses native HTML controls.

`TextInput` adapts the source `InputField`'s control/prefix behavior without its label or feedback. It retains `minValue`/`maxValue` aliases and supports native `type` values. `TextareaInput` defaults to three rows. `CheckboxInput` supports controlled/uncontrolled and indeterminate states; `RadioInput` is used inside `RadioGroupInput` for roving focus, selection, and form values.

`ToggleInput` is an on/off switch built on Radix Switch, not a pressed-state button or tri-state checkbox. It accepts boolean `checked`/`defaultChecked` and `onCheckedChange`, forwards a React 19 button ref, and preserves native form `name`/`value`, `disabled`, and `required` semantics. Give it an accessible name through a native label, `aria-label`, or `aria-labelledby`. Space and Enter toggle it without submitting the form. Thumb positioning respects RTL, and animations respect reduced motion.

`FieldLabel` and `FieldFeedback` are reusable presentation components. A label uses `htmlFor`; for a radio group's accessible name, use `asComponent="span"` with an `id` and reference it through `aria-labelledby`. Required markers are decorative. Feedback supports `help`/`helpId` and `error`/`errorId`, with errors announced as alerts.

```tsx
<FieldLabel htmlFor="name" required>
  Name
</FieldLabel>;
<TextInput id="name" aria-describedby="name-help" />;
<FieldFeedback help="Use your full name" helpId="name-help" />;
```

All input and field presentation styles use scoped SCSS modules and the same four-layer token system. The source's typography is converted to `rem`.

**Fields** are RHF-ready compositions: `TextField`, `EmailField`, `CheckboxField`, `RadioField`, `TextareaField`, and `ToggleField`. They include `FieldLabel` and `FieldFeedback`, bind through `useController`, and accept a typed `name`, optional `control`, `rules`, `defaultValue`, `disabled`, and normal input presentation props. They work under a `FormProvider` or with explicit `control`.

```tsx
import {
  CheckboxField,
  EmailField,
  RadioField,
  Submit,
  TextareaField,
  TextField,
  ToggleField,
} from "@bezny/base";
import { FormProvider, useForm } from "react-hook-form";

export function ProfileEditor() {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      accepted: false,
      plan: "basic",
      notes: "",
      notifications: false,
    },
  });
  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => saveProfile(values))}
      >
        <TextField
          name="name"
          label="Name"
          help="Use your full name"
          rules={{ required: "Name is required" }}
        />
        <EmailField name="email" label="Email" />
        <CheckboxField name="accepted" label="Accept terms" />
        <RadioField
          name="plan"
          label="Plan"
          options={[
            { label: "Basic", value: "basic" },
            { label: "Pro", value: "pro" },
          ]}
        />
        <TextareaField name="notes" label="Notes" />
        <ToggleField
          name="notifications"
          label="Notifications"
          help="Receive updates"
        />
        <Submit>Save</Submit>
      </form>
    </FormProvider>
  );
}
```

`saveProfile` is application-owned. Supply default values to RHF and use a resolver or `rules` for validation. `EmailField` sets native `type="email"`; it does not impose an email regex or schema. With `noValidate`, RHF owns error presentation rather than browser validation bubbles. Required rules also drive required markers and native required semantics.

Fields preserve externally supplied `aria-describedby` IDs and append generated help/error IDs. They set `aria-invalid` on invalid controls, announce error messages, and connect RHF focus refs to actual inputs/buttons. `RadioField` accepts string-valued `options` with labels and optional `disabled` flags; values must be unique. It labels the group and focuses the selected enabled option, or the first enabled option, on validation errors. `CheckboxField` and `ToggleField` bind boolean form values; use unbound `CheckboxInput` for tri-state controls. `ToggleField` supports RHF reset, disabled values, validation feedback, blur/touched tracking, and error focus just like other fields. A `required` rule means the switch must be on; omit that rule when both on and off are valid.

Install `react-hook-form` in the consuming application when importing its APIs. The library keeps RHF, React, Radix, and Lucide external in the Vite build, so form components use the same provider runtime as their consumers.

## Light and dark mode

Importing `@bezny/base/style.css` enables OS-based colour mode automatically through `prefers-color-scheme`. Changes to OS settings update the page without JavaScript. The stylesheet sets the theme boundary's background, inherited text/font, and `color-scheme` for native controls, scrollbars, and browser UI.

Override the OS preference with a CSS class, preferably on `<html>`:

| Root element                 | Colour mode         |
| ---------------------------- | ------------------- |
| `<html class="bezny-light">` | Always light        |
| `<html class="bezny-dark">`  | Always dark         |
| `<html>` (neither class)     | Follow OS (default) |

Remove both classes to restore automatic mode; replace the old class rather than accumulating modes. If both classes are present, dark wins. No `data-theme` attribute or theme provider is used. Applications own preference persistence and any theme-switcher UI. To avoid a flash, set a saved explicit class before the stylesheet loads.

Classes also work with React `className` on a wrapper or with a class on `<body>`. Nested explicit boundaries are supported, including light content inside a dark page:

```tsx
<div className="bezny-dark">
  <Heading>Dark interface</Heading>
  <section className="bezny-light">
    <TextInput aria-label="Light preview" />
  </section>
</div>
```

Every boundary redeclares logical and structural aliases so controls resolve against their local palette rather than already-resolved ancestor values. Unclassified descendants inherit the surrounding mode. Portals inherit their actual DOM container's mode, not React context; apply the same class to the portal container when using a nested theme.

Dark mode provides dark page/input/disabled surfaces, light text and feedback, brighter error text and focus rings, visible control borders, and lighter secondary interaction states. Typography and spacing do not change. Default text and button labels meet WCAG AA's 4.5:1 contrast in both modes; input boundaries meet 3:1. Disabled controls retain their intentional reduced opacity. Custom palette overrides must be contrast-checked again.

To customise themes, override logical colour mappings on the relevant boundary after the stylesheet (using foundational references in Sass). To customise foundational colours within a nested boundary, re-emit the logical and structural declarations there as well; inherited aliases do not recompute automatically. The source `logical.declarations(light|dark)` mixin validates the mode and emits the full logical system. Sass modules remain internal package source, not public exports.

## Styling

Styles use locally scoped SCSS module classes and the project's four-layer [SCSS token architecture](../../README.md#scss-token-architecture). Shared defaults and theme boundaries are included in `@bezny/base/style.css`; control aliases are bound on each component. Text color inherits from the surrounding interface.

- `src/tokens/_css-properties.scss` — pure CSS-name/reference functions and declaration mixins, inspired by [Bulma](https://github.com/jgthms/bulma/blob/main/sass/utilities/css-variables.scss).
- `src/tokens/_foundational.scss` — absolute sizes in `rem`, font family, and weight.
- `src/tokens/_logical.scss` — typography and icon scales referencing foundations.
- `src/tokens/_structural.scss` — heading purposes referencing logical scales.
- `src/content/heading-typography.scss` and `src/content/heading.module.scss` — heading control aliases and their usage.
- `src/controls/button-appearance.scss` and `src/controls/button.module.scss` — button control aliases, states, variants, and sizes.
- `src/inputs/toggle-appearance.scss` and `src/inputs/toggle-input.module.scss` — scoped switch control tokens and track/thumb states.
- `src/theme/theme-appearance.scss` — theme-boundary control tokens for the canvas and inherited typography.
- `src/tokens.scss` — shared `:root` defaults, automatic OS mode, and explicit `.bezny-light`/`.bezny-dark` boundaries.

Toggle tokens use `--bezny-control-toggle-*`, bound on the switch root and inherited by its thumb. Default `width`, `height`, `thumb-size`, and `inset` are `2.5rem`, `1.5rem`, `1.25rem`, and `0.125rem`. Theme `background`, `checked-background`, `thumb-background`, `focus-ring`, `border-error`, `opacity-disabled`, and `duration-interaction` through the same adjacent-layer token chain. Component-scoped overrides affect only that switch; shared foundational/logical overrides belong on `:root`.

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

Real-browser theme and contrast tests require Chromium (or a compatible Chrome executable):

```sh
CHROMIUM_PATH=/usr/bin/chromium node --test test/theme.browser.mjs
```

Run this from `packages/base` after building. The tests exercise both OS preferences, explicit class overrides, returning to automatic mode, nested boundaries, native colour schemes, component colours, derived states, focus rings, and contrast.

Build first when running package tests directly. The root `pnpm test` builds automatically through Turbo. Builds emit `dist/index.js`, type declarations, source maps, and `dist/style.css`. React and its JSX runtime remain external; consumers supply React through the peer dependency.
