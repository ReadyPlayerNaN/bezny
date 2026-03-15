# Theming System Design

## Overview

A three-tier CSS custom property theming system for bezny. Themes are the primary way of modifying styles. Consumers import components and their own theme CSS — theme variables override defaults by cascade.

## Goals

- Consumers can theme the entire framework by providing a few base colors
- Full shade ramps derived at runtime via `oklch()` — no build step required for dynamic theming
- Responds to `prefers-color-scheme`, `prefers-contrast`, `prefers-reduced-motion`, `prefers-reduced-transparency`
- Each media query overridable by `.bzn--*` class names
- Three override tiers: primitive (shade scale), semantic (roles), component (per-widget)

## Token Architecture

### Tier 1: Primitive tokens

Raw color scale derived from a base color via oklch lightness interpolation.

```css
:root {
  --bzn-primary: 45% 0.2 10;

  --bzn-primary-50:  oklch(97% 0.02 10);
  --bzn-primary-100: oklch(93% 0.05 10);
  --bzn-primary-200: oklch(85% 0.08 10);
  --bzn-primary-300: oklch(73% 0.13 10);
  --bzn-primary-400: oklch(62% 0.17 10);
  --bzn-primary-500: oklch(50% 0.2  10);
  --bzn-primary-600: oklch(45% 0.2  10);
  --bzn-primary-700: oklch(38% 0.18 10);
  --bzn-primary-800: oklch(30% 0.15 10);
  --bzn-primary-900: oklch(23% 0.12 10);
  --bzn-primary-950: oklch(15% 0.08 10);
}
```

Design curve:
- Lightness values at each step are fixed
- Chroma reduces at extremes (50, 900, 950) to avoid oversaturation
- Hue comes from the input color
- Consumers can override any individual shade

Palettes: `primary`, `neutral`, `success`, `warning`, `danger`.

### Tier 2: Semantic tokens

Role-based aliases that reference primitives. This is the only layer that changes between modes.

```css
:root {
  /* Text */
  --bzn-text:            var(--bzn-neutral-50);
  --bzn-text-muted:      var(--bzn-neutral-400);
  --bzn-text-on-primary: var(--bzn-neutral-50);

  /* Surfaces */
  --bzn-surface:         var(--bzn-neutral-950);
  --bzn-surface-raised:  var(--bzn-neutral-900);
  --bzn-surface-overlay: var(--bzn-neutral-800);

  /* Borders */
  --bzn-border:          var(--bzn-neutral-700);
  --bzn-border-muted:    var(--bzn-neutral-800);

  /* Interactive */
  --bzn-interactive:          var(--bzn-primary-600);
  --bzn-interactive-hover:    var(--bzn-primary-500);
  --bzn-interactive-active:   var(--bzn-primary-700);
  --bzn-interactive-disabled: var(--bzn-neutral-700);

  /* Focus */
  --bzn-focus-ring:      var(--bzn-primary-400);

  /* Feedback */
  --bzn-success:         var(--bzn-success-600);
  --bzn-warning:         var(--bzn-warning-500);
  --bzn-error:           var(--bzn-danger-500);

  /* Motion */
  --bzn-transition:      200ms;
  --bzn-transition-fn:   ease;

  /* Transparency */
  --bzn-overlay-opacity: 0.6;
  --bzn-backdrop-blur:   4px;
}
```

~20-25 semantic tokens total.

### Tier 3: Component tokens

Per-component vars that default to semantic tokens. Components only reference this tier.

```css
:root {
  --button-primary-bg:     var(--bzn-interactive);
  --button-primary-border: var(--bzn-interactive);
  --button-primary-color:  var(--bzn-text-on-primary);
  --card-bg:               var(--bzn-surface-raised);
  --card-border:           var(--bzn-border);
  --input-bg:              var(--bzn-surface-overlay);
  --input-border:          var(--bzn-border);
  --input-focus-border:    var(--bzn-focus-ring);
  --input-error-border:    var(--bzn-error);
  /* ... */
}
```

Component tokens never reference primitives directly — always semantic tokens.

## Media Queries and Class Overrides

Dark mode is the default. Media queries use `:root:not(.bzn--override)` so class overrides always win.

```css
/* Auto light */
@media (prefers-color-scheme: light) {
  :root:not(.bzn--dark) {
    --bzn-text:          var(--bzn-neutral-950);
    --bzn-surface:       var(--bzn-neutral-50);
    --bzn-surface-raised: var(--bzn-neutral-100);
    --bzn-border:        var(--bzn-neutral-200);
    --bzn-interactive:   var(--bzn-primary-700);
    /* ... */
  }
}

/* Force light/dark */
.bzn--light { /* same as light media query */ }
.bzn--dark  { /* same as dark defaults — used to force dark inside light */ }

/* High contrast */
@media (prefers-contrast: more) {
  :root:not(.bzn--no-high-contrast) {
    --bzn-text-muted: var(--bzn-neutral-300);
    --bzn-border:     var(--bzn-neutral-500);
  }
}
.bzn--high-contrast { /* same, forced */ }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  :root:not(.bzn--allow-motion) {
    --bzn-transition: 0ms;
  }
}
.bzn--reduce-motion { --bzn-transition: 0ms; }

/* Reduced transparency */
@media (prefers-reduced-transparency: reduce) {
  :root:not(.bzn--allow-transparency) {
    --bzn-overlay-opacity: 1;
    --bzn-backdrop-blur: 0px;
  }
}
.bzn--reduce-transparency { --bzn-overlay-opacity: 1; --bzn-backdrop-blur: 0px; }
```

## SCSS Mixin API

### Simple API

```scss
@use '@bezny/styles/theme' as bzn;

:root {
  @include bzn.theme(
    $primary: oklch(45% 0.2 10),
    $neutral: oklch(30% 0.01 260),
  );
}
```

Optional parameters:
- `$success` — defaults to emerald-like oklch
- `$warning` — defaults to amber-like oklch
- `$danger` — defaults to rose-like oklch
- `$radius` — base border radius (default: 8px)
- `$transition` — default transition duration (default: 200ms)
- `$prefix` — CSS variable prefix (default: 'bzn')

### Full API

```scss
@use '@bezny/styles/theme' as bzn;

$my-brand: (
  50:  oklch(97% 0.02 280),
  100: oklch(93% 0.05 280),
  // ...
  950: oklch(15% 0.08 280),
);

:root {
  @include bzn.theme(
    $primary: $my-brand,
    $neutral: bzn.$slate,
  );
}
```

When the mixin receives an oklch color string, it generates the shade map. When it receives a SCSS map, it uses it directly.

### Mixin output

A single `bzn.theme()` call outputs all three token tiers plus all media queries and class overrides.

### Consumer override example

```scss
@use '@bezny/styles/theme' as bzn;

:root {
  @include bzn.theme(
    $primary: oklch(50% 0.18 250),
    $neutral: oklch(25% 0.01 250),
  );

  // Override a single component token
  --button-primary-bg: var(--bzn-primary-700);

  // Override a semantic token (affects all components using it)
  --bzn-surface-raised: var(--bzn-neutral-800);
}
```

## Migration from Current System

- Replace `theme-dark.scss` and `theme-light.scss` with a single theme file using the mixin
- Rename component CSS variables to shorter names
- Update component SCSS modules to use new variable names
- Remove `_variables.scss` (raw SCSS color vars) — replaced by oklch primitives
- Keep `_reactions.scss` mixins, update variable references
- Built-in palettes (slate, bordeaux, emerald, amber, rose) re-exported as SCSS maps for convenience
