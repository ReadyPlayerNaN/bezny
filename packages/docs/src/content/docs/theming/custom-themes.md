---
title: Custom Themes
---

Create a custom theme by using the `bzn.theme()` SCSS mixin. It generates all three token tiers plus media query responses from your base colors.

## Simple API

Pass oklch colors and the mixin generates full shade ramps automatically:

```scss
@use '@bezny/core/theme' as bzn;

:root {
  @include bzn.theme(
    $primary: (h: 250, c: 0.18),
    $neutral: (h: 250, c: 0.01),
  );
}

@include bzn.responsive();
```

The `h` (hue) and `c` (chroma) values are used with a fixed lightness curve to produce 11 shades per palette. Chroma is automatically reduced at the extremes (50, 900, 950) to avoid oversaturation.

## Full API

For precise control, pass complete shade maps instead of hue/chroma pairs:

```scss
@use '@bezny/core/theme' as bzn;

$my-brand: (
  50:  oklch(97% 0.02 280),
  100: oklch(93% 0.05 280),
  200: oklch(85% 0.08 280),
  300: oklch(73% 0.13 280),
  400: oklch(62% 0.17 280),
  500: oklch(50% 0.2 280),
  600: oklch(45% 0.2 280),
  700: oklch(38% 0.18 280),
  800: oklch(30% 0.15 280),
  900: oklch(23% 0.12 280),
  950: oklch(15% 0.08 280),
);

:root {
  @include bzn.theme(
    $primary: $my-brand,
    $neutral: bzn.$slate,
  );
}

@include bzn.responsive();
```

You can mix approaches: use a shade map for one palette and hue/chroma for another.

## Mixin parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `$primary` | `$bordeaux` | Primary brand palette (shade map or `(h, c)`) |
| `$neutral` | `$slate` | Neutral/gray palette |
| `$success` | `$emerald` | Success feedback palette |
| `$warning` | `$amber` | Warning feedback palette |
| `$danger` | `$rose` | Danger/error feedback palette |
| `$transition` | `200ms` | Default transition duration |
| `$prefix` | `'bzn'` | CSS variable prefix |

## Built-in palettes

The following palettes are available as SCSS maps from `@bezny/core/palettes`:

- `$slate` — neutral gray-blue
- `$bordeaux` — warm red (default primary)
- `$emerald` — green (default success)
- `$amber` — yellow-orange (default warning)
- `$rose` — pink-red (default danger)

```scss
@use '@bezny/core/palettes' as palettes;

:root {
  @include bzn.theme(
    $neutral: palettes.$slate,
  );
}
```

## Responsive mixin

The `bzn.responsive()` mixin must be called at the root level (outside `:root`) to emit media queries and class overrides. Without it, color scheme switching and accessibility preferences will not work.

```scss
@use '@bezny/core/theme' as bzn;

:root {
  @include bzn.theme($primary: (h: 250, c: 0.18));
}

// This must be at the top level, not inside :root
@include bzn.responsive();
```

## Overriding individual tokens

After calling the theme mixin, you can override tokens at any tier:

```scss
:root {
  @include bzn.theme(
    $primary: (h: 250, c: 0.18),
    $neutral: (h: 250, c: 0.01),
  );

  // Override a semantic token (affects all components using it)
  --bzn-surface-raised: var(--bzn-neutral-800);

  // Override a single component token
  --button-primary-bg: var(--bzn-primary-700);
}
```

You can also override tokens in plain CSS without SCSS:

```css
:root {
  --bzn-interactive: var(--bzn-primary-700);
  --card-bg: var(--bzn-neutral-900);
}
```
