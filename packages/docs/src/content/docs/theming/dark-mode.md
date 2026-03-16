---
title: Dark Mode and Accessibility
---

bezny responds to user preferences via CSS media queries and supports manual overrides through CSS class names on any element.

## Color scheme

Dark mode is the default. When the user's OS is set to light mode, bezny automatically switches via `prefers-color-scheme: light`.

### Automatic behavior

No configuration needed. The `bzn.responsive()` mixin emits:

```css
@media (prefers-color-scheme: light) {
  :root:not(.bzn--dark) {
    /* light semantic tokens */
  }
}
```

The `:not(.bzn--dark)` selector means that adding `.bzn--dark` to an element prevents the automatic light switch within it.

### Manual override

Force a specific mode with CSS classes:

| Class | Effect |
|-------|--------|
| `.bzn--light` | Force light mode regardless of OS preference |
| `.bzn--dark` | Force dark mode regardless of OS preference |

```html
<!-- Force dark mode on the whole page -->
<html class="bzn--dark">

<!-- Force light mode on a specific section -->
<div class="bzn--light">
  <p>This section is always light.</p>
</div>
```

## High contrast

Automatically activates when the user requests high contrast via OS settings. Increases border visibility and makes muted text more readable.

| Class | Effect |
|-------|--------|
| `.bzn--high-contrast` | Force high contrast mode |
| `.bzn--no-high-contrast` | Prevent automatic high contrast |

## Reduced motion

Disables transitions when the user prefers reduced motion.

| Class | Effect |
|-------|--------|
| `.bzn--reduce-motion` | Force reduced motion (sets `--bzn-transition: 0ms`) |
| `.bzn--allow-motion` | Prevent automatic motion reduction |

## Reduced transparency

Removes backdrop blur and sets overlay opacity to 1 when the user prefers reduced transparency.

| Class | Effect |
|-------|--------|
| `.bzn--reduce-transparency` | Force reduced transparency |
| `.bzn--allow-transparency` | Prevent automatic transparency reduction |

## Scoped overrides

All class overrides can be applied to any element, not just `:root`. This lets you create mixed-mode layouts:

```html
<body>
  <nav class="bzn--dark">
    <!-- Always dark sidebar -->
  </nav>
  <main class="bzn--light">
    <!-- Always light content area -->
  </main>
</body>
```

## Summary of media queries

| Media query | Auto behavior | Force class | Opt-out class |
|-------------|--------------|-------------|---------------|
| `prefers-color-scheme: light` | Switch to light tokens | `.bzn--light` | `.bzn--dark` |
| `prefers-contrast: more` | Increase border/text contrast | `.bzn--high-contrast` | `.bzn--no-high-contrast` |
| `prefers-reduced-motion: reduce` | Set transitions to 0ms | `.bzn--reduce-motion` | `.bzn--allow-motion` |
| `prefers-reduced-transparency: reduce` | Remove blur, full opacity | `.bzn--reduce-transparency` | `.bzn--allow-transparency` |
