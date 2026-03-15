# Theming System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flat CSS variable theming with a three-tier token system (primitive → semantic → component) powered by oklch shade generation, media query support, and `.bzn--*` class overrides.

**Architecture:** A `bzn.theme()` SCSS mixin generates all three token tiers plus media queries from a few base colors. Components consume only component-tier tokens, which default to semantic tokens, which default to primitives. Mode switching (dark/light, contrast, motion, transparency) only reassigns semantic tokens.

**Tech Stack:** SCSS (sass), CSS oklch(), CSS custom properties, Vite

---

### Task 1: Create built-in palette maps

**Files:**
- Create: `packages/styles/src/_palettes.scss`

**Step 1: Write the palette file**

This file re-exports the existing color palettes as SCSS maps keyed by shade (50–950). These are used as defaults for the theme mixin and can be imported by consumers who want to use them with the full API.

```scss
// Built-in palettes as SCSS maps (shade → oklch value)
// These use the same colors as the old $_variables.scss, converted to oklch.

$slate: (
  50:  oklch(97.8% 0.005 260),
  100: oklch(95.5% 0.01 260),
  200: oklch(90.7% 0.015 260),
  300: oklch(82.8% 0.02 260),
  400: oklch(65.4% 0.025 255),
  500: oklch(55.4% 0.023 255),
  600: oklch(44.6% 0.02 260),
  700: oklch(37.2% 0.018 260),
  800: oklch(27.9% 0.015 260),
  900: oklch(21.0% 0.012 260),
  950: oklch(13.0% 0.008 260),
);

$bordeaux: (
  50:  oklch(96.5% 0.015 10),
  100: oklch(93.5% 0.03 10),
  200: oklch(85.0% 0.06 10),
  300: oklch(73.0% 0.1 10),
  400: oklch(62.0% 0.15 10),
  500: oklch(52.0% 0.18 10),
  600: oklch(45.0% 0.19 10),
  700: oklch(38.0% 0.17 10),
  800: oklch(32.0% 0.14 10),
  900: oklch(28.0% 0.1 10),
  950: oklch(18.0% 0.07 10),
);

$emerald: (
  100: oklch(94.5% 0.06 160),
  200: oklch(90.0% 0.1 160),
  300: oklch(82.0% 0.14 160),
  400: oklch(75.0% 0.15 160),
  500: oklch(65.0% 0.15 160),
  600: oklch(55.0% 0.14 160),
  700: oklch(48.0% 0.12 160),
);

$amber: (
  100: oklch(95.0% 0.06 85),
  200: oklch(90.5% 0.1 85),
  300: oklch(86.0% 0.14 85),
  400: oklch(82.0% 0.15 85),
  500: oklch(76.0% 0.14 85),
  600: oklch(67.0% 0.13 85),
  700: oklch(58.0% 0.12 85),
);

$rose: (
  100: oklch(93.0% 0.04 15),
  200: oklch(88.0% 0.06 15),
  300: oklch(80.0% 0.1 15),
  400: oklch(72.0% 0.15 15),
  500: oklch(62.0% 0.19 15),
  600: oklch(52.0% 0.2 15),
  700: oklch(45.0% 0.18 15),
);
```

**Step 2: Commit**

```bash
git add packages/styles/src/_palettes.scss
git commit -m "feat(styles): add built-in oklch palette maps"
```

---

### Task 2: Create shade generation mixin

**Files:**
- Create: `packages/styles/src/_shade.scss`

**Step 1: Write the shade generation logic**

This mixin takes either a SCSS map (full API) or a map with `h` and `c` keys (simple API) and emits CSS custom properties for the full shade scale.

```scss
@use 'sass:map';
@use 'sass:meta';

// Fixed lightness curve for shade generation
$_lightness-curve: (
  50:  97%,
  100: 93%,
  200: 85%,
  300: 73%,
  400: 62%,
  500: 50%,
  600: 45%,
  700: 38%,
  800: 30%,
  900: 23%,
  950: 15%,
);

// Chroma multiplier — reduced at extremes to avoid oversaturation
$_chroma-curve: (
  50:  0.1,
  100: 0.25,
  200: 0.4,
  300: 0.65,
  400: 0.85,
  500: 1.0,
  600: 1.0,
  700: 0.9,
  800: 0.75,
  900: 0.6,
  950: 0.4,
);

// Generate shade scale CSS custom properties.
// $name: prefix name (e.g. "primary")
// $palette: either a shade map (50: oklch(...), ...) or a simple map (h: 10, c: 0.2)
// $prefix: CSS variable prefix
@mixin shade-scale($name, $palette, $prefix: 'bzn') {
  @if map.has-key($palette, h) and map.has-key($palette, c) {
    // Simple API: generate from hue + chroma
    $h: map.get($palette, h);
    $c: map.get($palette, c);

    @each $shade, $lightness in $_lightness-curve {
      $chroma-mult: map.get($_chroma-curve, $shade);
      --#{$prefix}-#{$name}-#{$shade}: oklch(#{$lightness} #{$c * $chroma-mult} #{$h});
    }
  } @else {
    // Full API: use provided shade map directly
    @each $shade, $value in $palette {
      --#{$prefix}-#{$name}-#{$shade}: #{$value};
    }
  }
}
```

**Step 2: Commit**

```bash
git add packages/styles/src/_shade.scss
git commit -m "feat(styles): add oklch shade generation mixin"
```

---

### Task 3: Create semantic token mixin

**Files:**
- Create: `packages/styles/src/_semantic.scss`

**Step 1: Write the semantic token definitions**

Two mixins: one for dark mode defaults, one for light mode overrides. A third for high contrast adjustments.

```scss
// Semantic tokens — maps roles to primitive shades.
// Only this layer changes between modes.

@mixin dark($prefix: 'bzn') {
  // Text
  --#{$prefix}-text: var(--#{$prefix}-neutral-50);
  --#{$prefix}-text-muted: var(--#{$prefix}-neutral-400);
  --#{$prefix}-text-on-primary: var(--#{$prefix}-neutral-50);

  // Surfaces
  --#{$prefix}-surface: var(--#{$prefix}-neutral-950);
  --#{$prefix}-surface-raised: var(--#{$prefix}-neutral-900);
  --#{$prefix}-surface-overlay: var(--#{$prefix}-neutral-800);

  // Borders
  --#{$prefix}-border: var(--#{$prefix}-neutral-700);
  --#{$prefix}-border-muted: var(--#{$prefix}-neutral-800);

  // Interactive
  --#{$prefix}-interactive: var(--#{$prefix}-primary-600);
  --#{$prefix}-interactive-hover: var(--#{$prefix}-primary-500);
  --#{$prefix}-interactive-active: var(--#{$prefix}-primary-700);
  --#{$prefix}-interactive-disabled: var(--#{$prefix}-neutral-700);
  --#{$prefix}-interactive-disabled-text: var(--#{$prefix}-neutral-400);

  // Focus
  --#{$prefix}-focus-ring: var(--#{$prefix}-primary-400);

  // Feedback
  --#{$prefix}-success: var(--#{$prefix}-success-600);
  --#{$prefix}-success-subtle: var(--#{$prefix}-success-700);
  --#{$prefix}-success-text: var(--#{$prefix}-success-100);
  --#{$prefix}-warning: var(--#{$prefix}-warning-500);
  --#{$prefix}-warning-subtle: var(--#{$prefix}-warning-700);
  --#{$prefix}-warning-text: var(--#{$prefix}-warning-100);
  --#{$prefix}-error: var(--#{$prefix}-danger-500);
  --#{$prefix}-error-subtle: var(--#{$prefix}-danger-700);
  --#{$prefix}-error-text: var(--#{$prefix}-danger-100);

  // Motion
  --#{$prefix}-transition: 200ms;
  --#{$prefix}-transition-fn: ease;

  // Transparency
  --#{$prefix}-overlay-opacity: 0.6;
  --#{$prefix}-backdrop-blur: 4px;
}

@mixin light($prefix: 'bzn') {
  // Text
  --#{$prefix}-text: var(--#{$prefix}-neutral-950);
  --#{$prefix}-text-muted: var(--#{$prefix}-neutral-500);
  --#{$prefix}-text-on-primary: var(--#{$prefix}-neutral-50);

  // Surfaces
  --#{$prefix}-surface: var(--#{$prefix}-neutral-50);
  --#{$prefix}-surface-raised: var(--#{$prefix}-neutral-100);
  --#{$prefix}-surface-overlay: var(--#{$prefix}-neutral-50);

  // Borders
  --#{$prefix}-border: var(--#{$prefix}-neutral-200);
  --#{$prefix}-border-muted: var(--#{$prefix}-neutral-100);

  // Interactive
  --#{$prefix}-interactive: var(--#{$prefix}-primary-700);
  --#{$prefix}-interactive-hover: var(--#{$prefix}-primary-600);
  --#{$prefix}-interactive-active: var(--#{$prefix}-primary-800);
  --#{$prefix}-interactive-disabled: var(--#{$prefix}-neutral-200);
  --#{$prefix}-interactive-disabled-text: var(--#{$prefix}-neutral-400);

  // Focus
  --#{$prefix}-focus-ring: var(--#{$prefix}-primary-700);

  // Feedback
  --#{$prefix}-success: var(--#{$prefix}-success-600);
  --#{$prefix}-success-subtle: var(--#{$prefix}-success-100);
  --#{$prefix}-success-text: var(--#{$prefix}-success-700);
  --#{$prefix}-warning: var(--#{$prefix}-warning-600);
  --#{$prefix}-warning-subtle: var(--#{$prefix}-warning-100);
  --#{$prefix}-warning-text: var(--#{$prefix}-warning-700);
  --#{$prefix}-error: var(--#{$prefix}-danger-600);
  --#{$prefix}-error-subtle: var(--#{$prefix}-danger-100);
  --#{$prefix}-error-text: var(--#{$prefix}-danger-700);

  // Transparency
  --#{$prefix}-overlay-opacity: 0.4;
  --#{$prefix}-backdrop-blur: 4px;
}

@mixin high-contrast($prefix: 'bzn') {
  --#{$prefix}-text-muted: var(--#{$prefix}-neutral-300);
  --#{$prefix}-border: var(--#{$prefix}-neutral-500);
  --#{$prefix}-border-muted: var(--#{$prefix}-neutral-600);
}

@mixin high-contrast-light($prefix: 'bzn') {
  --#{$prefix}-text-muted: var(--#{$prefix}-neutral-700);
  --#{$prefix}-border: var(--#{$prefix}-neutral-400);
  --#{$prefix}-border-muted: var(--#{$prefix}-neutral-300);
}
```

**Step 2: Commit**

```bash
git add packages/styles/src/_semantic.scss
git commit -m "feat(styles): add semantic token mixins for dark/light/contrast modes"
```

---

### Task 4: Create component token mixin

**Files:**
- Create: `packages/styles/src/_components.scss`

**Step 1: Write the component token defaults**

All component tokens reference semantic tokens. This is a single mixin that emits all component-level CSS custom properties.

```scss
@use 'grid' as *;

@mixin tokens($prefix: 'bzn') {
  // Transition shorthand
  --bzn-transition: var(--#{$prefix}-transition);
  --bzn-transition-fn: var(--#{$prefix}-transition-fn);

  // Typography
  --heading-color: var(--#{$prefix}-text);
  --paragraph-color: var(--#{$prefix}-text);
  --label-color: var(--#{$prefix}-text-muted);

  // Button — shared
  --button-radius: 8px;

  // Button — primary
  --button-primary-bg: var(--#{$prefix}-interactive);
  --button-primary-border: var(--#{$prefix}-interactive);
  --button-primary-color: var(--#{$prefix}-text-on-primary);
  --button-primary-hover-bg: var(--#{$prefix}-interactive-hover);
  --button-primary-hover-border: var(--#{$prefix}-interactive-hover);
  --button-primary-hover-color: var(--#{$prefix}-text-on-primary);
  --button-primary-active-bg: var(--#{$prefix}-interactive-active);
  --button-primary-active-border: var(--#{$prefix}-interactive-active);
  --button-primary-active-color: var(--#{$prefix}-text-on-primary);
  --button-primary-disabled-bg: var(--#{$prefix}-interactive-disabled);
  --button-primary-disabled-border: var(--#{$prefix}-interactive-disabled);
  --button-primary-disabled-color: var(--#{$prefix}-interactive-disabled-text);

  // Button — secondary
  --button-secondary-bg: var(--#{$prefix}-surface-raised);
  --button-secondary-border: var(--#{$prefix}-border);
  --button-secondary-color: var(--#{$prefix}-text);
  --button-secondary-hover-bg: var(--#{$prefix}-surface-overlay);
  --button-secondary-hover-border: var(--#{$prefix}-border);
  --button-secondary-hover-color: var(--#{$prefix}-text);
  --button-secondary-active-bg: var(--#{$prefix}-surface);
  --button-secondary-active-border: var(--#{$prefix}-border);
  --button-secondary-active-color: var(--#{$prefix}-text);
  --button-secondary-disabled-bg: var(--#{$prefix}-interactive-disabled);
  --button-secondary-disabled-border: var(--#{$prefix}-interactive-disabled);
  --button-secondary-disabled-color: var(--#{$prefix}-interactive-disabled-text);

  // Button — ghost
  --button-ghost-bg: transparent;
  --button-ghost-border: transparent;
  --button-ghost-color: var(--#{$prefix}-text);
  --button-ghost-hover-bg: var(--#{$prefix}-surface-raised);
  --button-ghost-hover-border: transparent;
  --button-ghost-hover-color: var(--#{$prefix}-text);
  --button-ghost-active-bg: var(--#{$prefix}-surface-overlay);
  --button-ghost-active-border: transparent;
  --button-ghost-active-color: var(--#{$prefix}-text);
  --button-ghost-disabled-bg: transparent;
  --button-ghost-disabled-border: transparent;
  --button-ghost-disabled-color: var(--#{$prefix}-interactive-disabled-text);

  // Input
  --input-bg: var(--#{$prefix}-surface-overlay);
  --input-border: var(--#{$prefix}-border);
  --input-color: var(--#{$prefix}-text);
  --input-hover-bg: var(--#{$prefix}-surface-overlay);
  --input-hover-border: var(--#{$prefix}-border-muted);
  --input-hover-color: var(--#{$prefix}-text);
  --input-active-bg: var(--#{$prefix}-surface-overlay);
  --input-active-border: var(--#{$prefix}-focus-ring);
  --input-active-color: var(--#{$prefix}-text);
  --input-disabled-bg: var(--#{$prefix}-surface);
  --input-disabled-border: var(--#{$prefix}-border-muted);
  --input-disabled-color: var(--#{$prefix}-interactive-disabled-text);
  --input-placeholder: var(--#{$prefix}-text-muted);
  --input-label-color: var(--#{$prefix}-text-muted);
  --input-label-focused: var(--#{$prefix}-focus-ring);

  // Validation
  --input-error-border: var(--#{$prefix}-error);
  --input-error-message: var(--#{$prefix}-error);
  --input-error-label: var(--#{$prefix}-error);
  --input-warning-border: var(--#{$prefix}-warning);
  --input-warning-message: var(--#{$prefix}-warning);
  --input-warning-label: var(--#{$prefix}-warning);
  --input-success-border: var(--#{$prefix}-success);
  --input-success-message: var(--#{$prefix}-success);
  --input-success-label: var(--#{$prefix}-success);

  // Radio
  --radio-border: var(--#{$prefix}-border);
  --radio-checked: var(--#{$prefix}-interactive);
  --radio-disabled: var(--#{$prefix}-interactive-disabled);

  // Checkbox
  --checkbox-border: var(--#{$prefix}-border);
  --checkbox-checked: var(--#{$prefix}-interactive);
  --checkbox-disabled: var(--#{$prefix}-interactive-disabled);

  // Switch
  --switch-track-off: var(--#{$prefix}-border);
  --switch-track-on: var(--#{$prefix}-interactive);
  --switch-thumb: var(--#{$prefix}-text-on-primary);
  --switch-disabled-opacity: 0.5;

  // Card
  --card-bg: var(--#{$prefix}-surface-raised);
  --card-border: var(--#{$prefix}-border);
  --card-header-padding: #{size(3)} #{size(4)};
  --card-body-padding: #{size(4)};
  --card-footer-padding: #{size(3)} #{size(4)};
  --card-header-border: var(--#{$prefix}-border);
  --card-footer-border: var(--#{$prefix}-border);

  // Alert
  --alert-success-bg: var(--#{$prefix}-success-subtle);
  --alert-success-border: var(--#{$prefix}-success);
  --alert-success-color: var(--#{$prefix}-success-text);
  --alert-warning-bg: var(--#{$prefix}-warning-subtle);
  --alert-warning-border: var(--#{$prefix}-warning);
  --alert-warning-color: var(--#{$prefix}-warning-text);
  --alert-error-bg: var(--#{$prefix}-error-subtle);
  --alert-error-border: var(--#{$prefix}-error);
  --alert-error-color: var(--#{$prefix}-error-text);

  // Link
  --link-color: var(--#{$prefix}-interactive);
  --link-hover-color: var(--#{$prefix}-interactive-hover);
  --link-active-color: var(--#{$prefix}-interactive-active);
  --link-visited-color: var(--#{$prefix}-interactive-active);

  // Breadcrumb
  --breadcrumb-color: var(--#{$prefix}-text-muted);
  --breadcrumb-active-color: var(--#{$prefix}-text);
  --breadcrumb-separator-color: var(--#{$prefix}-border);

  // Avatar
  --avatar-initials-bg: var(--#{$prefix}-interactive);
  --avatar-initials-color: var(--#{$prefix}-text-on-primary);

  // AvatarStack
  --avatar-stack-overflow-bg: var(--#{$prefix}-surface-overlay);
  --avatar-stack-overflow-color: var(--#{$prefix}-text);
  --avatar-stack-border: var(--#{$prefix}-surface);

  // Sidebar
  --sidebar-bg: var(--#{$prefix}-surface);
  --sidebar-border: var(--#{$prefix}-border);
  --sidebar-group-label: var(--#{$prefix}-text-muted);

  // Navbar
  --navbar-bg: var(--#{$prefix}-surface);
  --navbar-border: var(--#{$prefix}-border);
  --navbar-brand-color: var(--#{$prefix}-text);
  --navbar-brand-hover-color: var(--#{$prefix}-text-muted);
  --navbar-toggle-color: var(--#{$prefix}-text-muted);
  --navbar-toggle-hover-bg: var(--#{$prefix}-surface-raised);
  --navlink-color: var(--#{$prefix}-text-muted);
  --navlink-hover-color: var(--#{$prefix}-text);
  --navlink-hover-bg: var(--#{$prefix}-surface-raised);
  --navlink-active-color: var(--#{$prefix}-interactive);
  --navlink-active-hover-color: var(--#{$prefix}-interactive-hover);

  // List
  --list-header-border: var(--#{$prefix}-border);
  --list-header-color: var(--#{$prefix}-text-muted);
  --list-row-border: var(--#{$prefix}-border-muted);
  --list-row-hover-bg: var(--#{$prefix}-surface-raised);
  --list-row-active-bg: var(--#{$prefix}-surface-overlay);
  --list-empty-color: var(--#{$prefix}-text-muted);
  --list-reloading-overlay: rgba(0, 0, 0, calc(var(--#{$prefix}-overlay-opacity) * 0.5));

  // Dropdown
  --dropdown-bg: var(--#{$prefix}-surface-overlay);
  --dropdown-border: var(--#{$prefix}-border);
  --dropdown-shadow: rgba(0, 0, 0, calc(var(--#{$prefix}-overlay-opacity) * 0.67));
  --dropdown-radius: #{size(2)};

  // Drawer
  --drawer-bg: var(--#{$prefix}-surface);
  --drawer-backdrop: rgba(0, 0, 0, var(--#{$prefix}-overlay-opacity));
  --drawer-border: var(--#{$prefix}-border);
  --drawer-close-color: var(--#{$prefix}-text-muted);
  --drawer-close-hover-color: var(--#{$prefix}-text);

  // Modal
  --modal-overlay-bg: rgba(0, 0, 0, var(--#{$prefix}-overlay-opacity));
  --modal-panel-bg: var(--#{$prefix}-surface);
  --modal-panel-border: var(--#{$prefix}-border);
  --modal-panel-shadow: 0 #{size(6)} #{size(12)} rgba(0, 0, 0, calc(var(--#{$prefix}-overlay-opacity) * 0.67));
  --modal-header-border: var(--#{$prefix}-border);
  --modal-footer-border: var(--#{$prefix}-border);
  --modal-close-color: var(--#{$prefix}-text-muted);
  --modal-close-hover-color: var(--#{$prefix}-text);
}
```

**Step 2: Commit**

```bash
git add packages/styles/src/_components.scss
git commit -m "feat(styles): add component token mixin defaulting to semantic tokens"
```

---

### Task 5: Create the main theme mixin

**Files:**
- Create: `packages/styles/src/_theme.scss`

**Step 1: Write the theme mixin**

This is the main entry point. It orchestrates shade generation, semantic tokens, component tokens, media queries, and class overrides.

```scss
@use 'sass:map';
@use 'shade' as shade;
@use 'semantic' as semantic;
@use 'components' as components;
@use 'palettes' as *;

// Main theme mixin.
// $primary, $neutral: either a shade map (50: oklch(...)) or simple (h: N, c: N)
// $success, $warning, $danger: same format, with built-in defaults
// $radius: base border radius
// $transition: default transition duration
// $prefix: CSS variable prefix
@mixin theme(
  $primary: $bordeaux,
  $neutral: $slate,
  $success: $emerald,
  $warning: $amber,
  $danger: $rose,
  $transition: 200ms,
  $prefix: 'bzn',
) {
  // Tier 1: Primitives
  @include shade.shade-scale('primary', $primary, $prefix);
  @include shade.shade-scale('neutral', $neutral, $prefix);
  @include shade.shade-scale('success', $success, $prefix);
  @include shade.shade-scale('warning', $warning, $prefix);
  @include shade.shade-scale('danger', $danger, $prefix);

  // Tier 2: Semantic (dark defaults)
  @include semantic.dark($prefix);

  // Override transition if non-default
  --#{$prefix}-transition: #{$transition};

  // Tier 3: Component tokens
  @include components.tokens($prefix);

  // Base styles
  color: var(--#{$prefix}-text);
  background-color: var(--#{$prefix}-surface);
  font-family: -apple-system, BlinkMacSystemFont, Inter, "Segoe UI", Roboto, Oxygen, sans-serif;
  font-size: clamp(15px, 0.9375rem + 0.25vw, 18px);
}

// Media queries and class overrides — call this at root level, outside :root.
// Typically: @include bzn.responsive($prefix);
@mixin responsive($prefix: 'bzn') {
  // Light mode: auto
  @media (prefers-color-scheme: light) {
    :root:not(.bzn--dark) {
      @include semantic.light($prefix);
    }
  }

  // Light mode: forced
  .bzn--light {
    @include semantic.light($prefix);
  }

  // Dark mode: forced (useful inside light context)
  .bzn--dark {
    @include semantic.dark($prefix);
  }

  // High contrast: auto
  @media (prefers-contrast: more) {
    :root:not(.bzn--no-high-contrast) {
      @include semantic.high-contrast($prefix);
    }

    // High contrast + light
    @media (prefers-color-scheme: light) {
      :root:not(.bzn--dark):not(.bzn--no-high-contrast) {
        @include semantic.high-contrast-light($prefix);
      }
    }
  }

  // High contrast: forced
  .bzn--high-contrast {
    @include semantic.high-contrast($prefix);
  }

  // Reduced motion: auto
  @media (prefers-reduced-motion: reduce) {
    :root:not(.bzn--allow-motion) {
      --#{$prefix}-transition: 0ms;
    }
  }

  // Reduced motion: forced
  .bzn--reduce-motion {
    --#{$prefix}-transition: 0ms;
  }

  // Reduced transparency: auto
  @media (prefers-reduced-transparency: reduce) {
    :root:not(.bzn--allow-transparency) {
      --#{$prefix}-overlay-opacity: 1;
      --#{$prefix}-backdrop-blur: 0px;
    }
  }

  // Reduced transparency: forced
  .bzn--reduce-transparency {
    --#{$prefix}-overlay-opacity: 1;
    --#{$prefix}-backdrop-blur: 0px;
  }
}
```

**Step 2: Commit**

```bash
git add packages/styles/src/_theme.scss
git commit -m "feat(styles): add main theme mixin with responsive media queries"
```

---

### Task 6: Create the default bezny theme file

**Files:**
- Create: `packages/styles/src/theme.scss`

**Step 1: Write the default theme**

This replaces `theme-dark.scss` and `theme-light.scss` with a single file.

```scss
@use 'theme' as bzn;
@use 'grid' as *;

:root {
  @include bzn.theme();
}

// Link base styles
a {
  color: var(--link-color);
  text-decoration: underline;
  text-underline-offset: size(0.5);
  transition: color var(--bzn-transition);

  &:visited {
    color: var(--link-visited-color);
  }

  &:hover {
    color: var(--link-hover-color);
  }

  &:active {
    color: var(--link-active-color);
  }
}

// Responsive overrides (media queries + class overrides)
@include bzn.responsive();
```

**Step 2: Commit**

```bash
git add packages/styles/src/theme.scss
git commit -m "feat(styles): add default bezny theme replacing dark/light split files"
```

---

### Task 7: Update the reactions mixin

**Files:**
- Modify: `packages/styles/src/_reactions.scss`

**Step 1: Update to use new variable names and add button-variant mixin**

The `interactive` and `input` mixins keep using local-scope `--interactive-*` / `--input-*` vars. Add the missing `button-variant` mixin that maps component tokens to the generic interactive vars.

```scss
// Interaction mixins using semantic CSS vars

@mixin interactive {
  background-color: var(--interactive-bg);
  border-color: var(--interactive-border);
  color: var(--interactive-color);
  transition:
    background-color var(--bzn-transition) var(--bzn-transition-fn),
    border-color var(--bzn-transition) var(--bzn-transition-fn),
    color var(--bzn-transition) var(--bzn-transition-fn);

  &:hover {
    background-color: var(--interactive-hover-bg);
    border-color: var(--interactive-hover-border);
    color: var(--interactive-hover-color);
  }

  &:active {
    background-color: var(--interactive-active-bg);
    border-color: var(--interactive-active-border);
    color: var(--interactive-active-color);
  }

  &:disabled {
    background-color: var(--interactive-disabled-bg);
    border-color: var(--interactive-disabled-border);
    color: var(--interactive-disabled-color);
    cursor: not-allowed;
  }
}

@mixin button-variant($variant) {
  --interactive-bg: var(--button-#{$variant}-bg);
  --interactive-border: var(--button-#{$variant}-border);
  --interactive-color: var(--button-#{$variant}-color);
  --interactive-hover-bg: var(--button-#{$variant}-hover-bg);
  --interactive-hover-border: var(--button-#{$variant}-hover-border);
  --interactive-hover-color: var(--button-#{$variant}-hover-color);
  --interactive-active-bg: var(--button-#{$variant}-active-bg);
  --interactive-active-border: var(--button-#{$variant}-active-border);
  --interactive-active-color: var(--button-#{$variant}-active-color);
  --interactive-disabled-bg: var(--button-#{$variant}-disabled-bg);
  --interactive-disabled-border: var(--button-#{$variant}-disabled-border);
  --interactive-disabled-color: var(--button-#{$variant}-disabled-color);
}

@mixin input-reactions {
  background-color: var(--input-bg);
  border-color: var(--input-border);
  color: var(--input-color);
  transition:
    background-color var(--bzn-transition) var(--bzn-transition-fn),
    border-color var(--bzn-transition) var(--bzn-transition-fn),
    color var(--bzn-transition) var(--bzn-transition-fn);

  &:hover {
    background-color: var(--input-hover-bg);
    border-color: var(--input-hover-border);
    color: var(--input-hover-color);
  }

  &:focus {
    background-color: var(--input-active-bg);
    border-color: var(--input-active-border);
    color: var(--input-active-color);
  }

  &:disabled {
    background-color: var(--input-disabled-bg);
    border-color: var(--input-disabled-border);
    color: var(--input-disabled-color);
    cursor: not-allowed;
  }
}
```

Note: `input` mixin renamed to `input-reactions` to avoid naming conflict with the HTML input element. The `:active` pseudo-class on inputs is replaced with `:focus` which is the actual desired behavior.

**Step 2: Commit**

```bash
git add packages/styles/src/_reactions.scss
git commit -m "feat(styles): update reactions with new var names, add button-variant mixin"
```

---

### Task 8: Update the validation mixin

**Files:**
- Modify: `packages/styles/src/_validation.scss`

**Step 1: Update to use new variable names**

```scss
@mixin status-border($status) {
  --input-border: var(--input-#{$status}-border);
  --input-hover-border: var(--input-#{$status}-border);
  --input-active-border: var(--input-#{$status}-border);
}

@mixin status-label($status) {
  color: var(--input-#{$status}-label);
}
```

**Step 2: Commit**

```bash
git add packages/styles/src/_validation.scss
git commit -m "refactor(styles): update validation mixin to new variable names"
```

---

### Task 9: Update Button component SCSS

**Files:**
- Modify: `packages/button/src/Button.module.scss`

**Step 1: Update to use new variable names**

```scss
@use 'grid' as *;
@use 'typography' as *;
@use 'reactions' as *;

.button {
  @include button-variant(primary);
  @include interactive;

  border-width: 1px;
  border-style: solid;
  border-radius: var(--button-radius);
  font-family: inherit;
  font-size: font-size(1);
  line-height: size(6);
  padding: size(2) size(4);
}

.primary {
  @include button-variant(primary);
}

.secondary {
  @include button-variant(secondary);
}

.ghost {
  @include button-variant(ghost);
}
```

No change needed — the Button.module.scss already uses the `button-variant` and `interactive` mixins with the correct structure. The variable name changes are handled by the updated `_reactions.scss`.

**Step 2: Commit (skip if no changes)**

---

### Task 10: Update Input component SCSS

**Files:**
- Modify: `packages/forms/src/Input.module.scss`

**Step 1: Update to use new variable names**

The Input component currently maps `--input-default-*` theme vars to local `--input-*` vars for the reactions mixin. With the new system, the component tokens are already named `--input-bg`, `--input-border`, etc., so the local mapping is no longer needed.

```scss
@use 'grid' as *;
@use 'typography' as *;
@use 'reactions' as *;
@use 'validation' as *;

.input {
  @include input-reactions;

  border-width: 1px;
  border-style: solid;
  border-radius: size(1);
  font-family: inherit;
  font-size: font-size(1);
  line-height: size(6);
  padding: size(2) size(3);
  flex-grow: 1;

  &::placeholder {
    color: var(--input-placeholder);
  }
}

.statusError {
  @include status-border(error);
}

.statusWarning {
  @include status-border(warning);
}

.statusSuccess {
  @include status-border(success);
}

.wrapper {
  display: flex;
  position: relative;

  .input {
    padding: size(5) size(3) size(1);

    &::placeholder {
      color: transparent;
    }

    &:focus + .label,
    &:not(:placeholder-shown) + .label {
      transform: translateY(calc(-1 * size(1.25)));
      font-size: size(3);
      color: var(--input-label-focused);
    }

    &:not(:focus):not(:placeholder-shown) + .label {
      color: var(--input-label-color);
    }

    &.statusError:focus + .label,
    &.statusError:not(:placeholder-shown) + .label {
      @include status-label(error);
    }

    &.statusWarning:focus + .label,
    &.statusWarning:not(:placeholder-shown) + .label {
      @include status-label(warning);
    }

    &.statusSuccess:focus + .label,
    &.statusSuccess:not(:placeholder-shown) + .label {
      @include status-label(success);
    }
  }
}

.label {
  position: absolute;
  top: size(1);
  left: size(3);
  color: var(--input-label-color);
  font-size: font-size(1);
  line-height: size(6);
  transform: translateY(size(2));
  transition:
    transform var(--bzn-transition),
    font-size var(--bzn-transition),
    color var(--bzn-transition);
  pointer-events: none;
}
```

**Step 2: Commit**

```bash
git add packages/forms/src/Input.module.scss
git commit -m "refactor(forms): update Input to use new theme variable names"
```

---

### Task 11: Update remaining form components

**Files:**
- Modify: `packages/forms/src/Select.module.scss` — same changes as Input
- Modify: `packages/forms/src/TextArea.module.scss` — same changes as Input
- Modify: `packages/forms/src/Checkbox.module.scss` — rename `--checkbox-border-color` → `--checkbox-border`, `--checkbox-checked-color` → `--checkbox-checked`, `--checkbox-disabled-color` → `--checkbox-disabled`, `--text-color` → `var(--bzn-text)`, `--transition-default` → `--bzn-transition`
- Modify: `packages/forms/src/Radio.module.scss` — same pattern as Checkbox
- Modify: `packages/forms/src/Switch.module.scss` — rename `--switch-track-off-color` → `--switch-track-off`, `--switch-track-on-color` → `--switch-track-on`, `--switch-thumb-color` → `--switch-thumb`, `--switch-disabled-opacity` stays same, `--transition-default` → `--bzn-transition`
- Modify: `packages/forms/src/StatusMessage.module.scss` — rename `--input-error-message-color` → `--input-error-message`, `--input-warning-message-color` → `--input-warning-message`, `--input-success-message-color` → `--input-success-message`

**Step 1: Update each file**

Apply the variable renames listed above. Each file is a straightforward find-and-replace of old variable names to new ones.

**Step 2: Commit**

```bash
git add packages/forms/src/
git commit -m "refactor(forms): update all form components to new theme variable names"
```

---

### Task 12: Update text components

**Files:**
- Modify: `packages/text/src/Heading.module.scss` — `--heading-color` stays same (already matches)
- Modify: `packages/text/src/Paragraph.module.scss` — `--paragraph-color` stays same
- Modify: `packages/text/src/Label.module.scss` — `--label-color` stays same

No changes needed — these already use the component token names defined in Task 4.

---

### Task 13: Update navigation components

**Files:**
- Modify: `packages/navigation/src/Navbar.module.scss` — `--navbar-background-color` → `--navbar-bg`, `--navbar-border-color` → `--navbar-border`
- Modify: `packages/navigation/src/NavbarBrand.module.scss` — `--navbar-brand-color` stays, `--navbar-brand-hover-color` stays, `--transition-default` → `--bzn-transition`
- Modify: `packages/navigation/src/NavbarToggle.module.scss` — `--navbar-toggle-color` stays, `--navbar-toggle-hover-background-color` → `--navbar-toggle-hover-bg`, `--transition-default` → `--bzn-transition`
- Modify: `packages/navigation/src/NavLink.module.scss` — `--navlink-color` stays, `--navlink-hover-background-color` → `--navlink-hover-bg`, `--navlink-hover-color` stays, `--navlink-active-color` stays, `--navlink-active-hover-color` stays, `--transition-default` → `--bzn-transition`
- Modify: `packages/navigation/src/Link.module.scss` — `--link-color` stays, `--link-hover-color` stays, `--link-active-color` stays, `--transition-default` → `--bzn-transition`
- Modify: `packages/navigation/src/Sidebar.module.scss` — `--sidebar-background-color` → `--sidebar-bg`, `--sidebar-border-color` → `--sidebar-border`, `--sidebar-group-label-color` → `--sidebar-group-label`
- Modify: `packages/navigation/src/Breadcrumbs.module.scss` — `--breadcrumb-color` stays, `--breadcrumb-active-color` stays, `--breadcrumb-separator-color` stays, `--transition-default` → `--bzn-transition`

**Step 1: Apply renames**

**Step 2: Commit**

```bash
git add packages/navigation/src/
git commit -m "refactor(navigation): update all navigation components to new theme variable names"
```

---

### Task 14: Update remaining components

**Files:**
- Modify: `packages/card/src/Card.module.scss` — `--card-background-color` → `--card-bg`, `--card-border-color` → `--card-border`, `--card-header-border-color` → `--card-header-border`, `--card-footer-border-color` → `--card-footer-border`, padding vars stay same
- Modify: `packages/alert/src/Alert.module.scss` — `--alert-success-background-color` → `--alert-success-bg`, `--alert-success-border-color` → `--alert-success-border`, `--alert-success-color` stays, same for warning/error
- Modify: `packages/avatar/src/Avatar.module.scss` — `--avatar-initials-background-color` → `--avatar-initials-bg`, `--avatar-initials-color` stays
- Modify: `packages/avatar/src/AvatarStack.module.scss` — `--avatar-stack-overflow-background` → `--avatar-stack-overflow-bg`, `--avatar-stack-overflow-color` stays, `--avatar-stack-border-color` → `--avatar-stack-border`
- Modify: `packages/data/src/List.module.scss` — `--list-header-border-color` → `--list-header-border`, `--list-header-color` stays, `--list-row-border-color` → `--list-row-border`, `--list-row-hover-background-color` → `--list-row-hover-bg`, `--list-row-active-background-color` → `--list-row-active-bg`, `--list-empty-color` stays, `--list-reloading-overlay-color` → `--list-reloading-overlay`
- Modify: `packages/dropdown/src/Dropdown.module.scss` — `--dropdown-background-color` → `--dropdown-bg`, `--dropdown-border-color` → `--dropdown-border`, `--dropdown-border-radius` → `--dropdown-radius`, `--dropdown-shadow-color` → `--dropdown-shadow`
- Modify: `packages/drawer/src/Drawer.module.scss` — `--drawer-background-color` → `--drawer-bg`, `--drawer-border-color` → `--drawer-border`, `--drawer-close-button-color` → `--drawer-close-color`, `--drawer-close-button-hover-color` → `--drawer-close-hover-color`, `--transition-default` → `--bzn-transition`
- Modify: `packages/dialog/src/Dialog.module.scss` — `--modal-panel-background` → `--modal-panel-bg`, `--modal-panel-border-color` → `--modal-panel-border`, `--modal-panel-shadow` stays, `--overlay-background-color` → `--modal-overlay-bg`, `--modal-header-border-color` → `--modal-header-border`, `--modal-footer-border-color` → `--modal-footer-border`, `--modal-close-color` stays, `--modal-close-hover-color` stays, `--transition-default` → `--bzn-transition`
- Modify: `packages/overlay/src/Overlay.module.scss` — `--overlay-background-color` → `--modal-overlay-bg`, `--overlay-z-index` stays

**Step 1: Apply renames**

**Step 2: Commit**

```bash
git add packages/card/ packages/alert/ packages/avatar/ packages/data/ packages/dropdown/ packages/drawer/ packages/dialog/ packages/overlay/
git commit -m "refactor: update remaining components to new theme variable names"
```

---

### Task 15: Update styles package exports

**Files:**
- Modify: `packages/styles/package.json`
- Modify: `packages/styles/vite.config.ts`

**Step 1: Update package.json exports**

```json
{
  "name": "@bezny/styles",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    "./theme.css": "./dist/theme.css",
    "./styles/*": "./src/_*.scss",
    "./theme": "./src/_theme.scss",
    "./palettes": "./src/_palettes.scss"
  },
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "lint": "biome check .",
    "lint:fix": "biome check --write ."
  },
  "devDependencies": {
    "sass": "catalog:",
    "vite": "catalog:"
  }
}
```

**Step 2: Update vite.config.ts**

```ts
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    cssCodeSplit: true,
    lib: {
      entry: {
        theme: resolve(import.meta.dirname, "src/theme.scss"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        assetFileNames: "[name][extname]",
      },
    },
  },
});
```

**Step 3: Commit**

```bash
git add packages/styles/package.json packages/styles/vite.config.ts
git commit -m "refactor(styles): update exports for unified theme file"
```

---

### Task 16: Remove old theme files

**Files:**
- Delete: `packages/styles/src/theme-dark.scss`
- Delete: `packages/styles/src/theme-light.scss`
- Delete: `packages/styles/src/_variables.scss`

**Step 1: Remove files**

```bash
git rm packages/styles/src/theme-dark.scss packages/styles/src/theme-light.scss packages/styles/src/_variables.scss
```

**Step 2: Commit**

```bash
git commit -m "chore(styles): remove old split theme files and raw SCSS variables"
```

---

### Task 17: Build and verify

**Step 1: Install dependencies and build**

```bash
pnpm install
pnpm --filter @bezny/styles build
```

Expected: Build succeeds, `dist/theme.css` is generated.

**Step 2: Verify CSS output**

Check that `dist/theme.css` contains:
- `--bzn-primary-*` primitive tokens (oklch values)
- `--bzn-text`, `--bzn-surface`, etc. semantic tokens
- `--button-primary-bg`, `--card-bg`, etc. component tokens
- `@media (prefers-color-scheme: light)` block
- `.bzn--light`, `.bzn--dark` class overrides
- `@media (prefers-contrast: more)` block
- `@media (prefers-reduced-motion: reduce)` block
- `@media (prefers-reduced-transparency: reduce)` block

**Step 3: Build all packages to check for broken references**

```bash
pnpm -r build
```

Expected: All packages build successfully.

**Step 4: Commit any fixes needed, then final commit**

```bash
git add -A
git commit -m "fix(styles): resolve build issues from theming migration"
```
