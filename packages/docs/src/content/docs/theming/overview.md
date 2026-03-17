---
title: Theming Overview
---

bezny uses a three-tier CSS custom property system for theming. A single SCSS mixin generates all tokens, media query responses, and class overrides from a few base colors. No build step is required for dynamic theming at runtime — everything runs on CSS custom properties and `oklch()`.

## Three-tier token architecture

### Tier 1: Primitive tokens

Raw color scales derived from base colors. Each palette produces 11 shades (50 through 950) using oklch lightness interpolation.

```css
--bzn-primary-50:  oklch(97% ...);
--bzn-primary-100: oklch(93% ...);
/* ... */
--bzn-primary-950: oklch(15% ...);
```

Five palettes are generated: `primary`, `neutral`, `success`, `warning`, and `danger`.

### Tier 2: Semantic tokens

Role-based aliases that reference primitives. This is the only layer that changes between dark and light modes.

```css
--bzn-text:              var(--bzn-neutral-50);
--bzn-surface:           var(--bzn-neutral-950);
--bzn-interactive:       var(--bzn-primary-600);
--bzn-border:            var(--bzn-neutral-700);
--bzn-focus-ring:        var(--bzn-primary-400);
--bzn-error:             var(--bzn-danger-500);
```

Semantic tokens cover text, surfaces, borders, interactive states, focus, feedback (success/warning/error), motion, and transparency.

### Tier 3: Component tokens

Per-component variables that default to semantic tokens. Components only reference this tier.

```css
--button-primary-bg:     var(--bzn-interactive);
--card-bg:               var(--bzn-surface-raised);
--input-border:          var(--bzn-border);
```

Component tokens never reference primitives directly — they always go through semantic tokens.

## How the tiers connect

```
Primitive (oklch shades)
  -> Semantic (roles: text, surface, interactive, ...)
    -> Component (button-bg, card-border, input-color, ...)
```

Overriding at any tier cascades down. Change a primitive and every semantic token referencing it updates. Change a semantic token and every component using it follows. Override a component token to target a single widget.

## Default theme

bezny ships a default theme using bordeaux (primary) and slate (neutral) palettes. Dark mode is the default, with automatic light mode via `prefers-color-scheme`.

To use the default theme, import the compiled CSS:

```css
@import "@bezny/core/theme.css";
```

For custom themes, see the [Custom Themes](/theming/custom-themes/) guide.
