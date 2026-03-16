# Theme Settings Design

## Goal

Extend the docs accent colour selector into a full theme settings panel with controls for color scheme (dark/light/auto), reduced motion (yes/no/auto), and reduced transparency (yes/no/auto).

## New component: `ButtonGroup` in `@bezny/switches`

A segmented button group for exclusive single-value selection, similar to `RadioGroup` but rendered as connected buttons.

### Files

- `ButtonGroup.tsx` — container with `<fieldset role="radiogroup">`
- `ButtonGroupOption.tsx` — `<button role="radio" aria-checked>` child
- `ButtonGroupContext.ts` — React context for shared state
- `ButtonGroup.module.scss` — connected pill styling

### API

```tsx
<ButtonGroup value="auto" onChange={setValue} legend="Color scheme">
  <ButtonGroupOption value="auto">Auto</ButtonGroupOption>
  <ButtonGroupOption value="light">Light</ButtonGroupOption>
  <ButtonGroupOption value="dark">Dark</ButtonGroupOption>
</ButtonGroup>
```

### ButtonGroup props

- `value?: string` — controlled selected value
- `defaultValue?: string` — uncontrolled default
- `onChange?: (value: string) => void`
- `disabled?: boolean`
- `legend?: string` — optional fieldset legend
- `children: ReactNode`
- `className?: ClassValue`

### ButtonGroupOption props

- `value: string`
- `disabled?: boolean`
- `children: ReactNode`
- `className?: ClassValue`

### Accessibility

- Container: `role="radiogroup"` on `<fieldset>`
- Options: `role="radio"`, `aria-checked` on `<button>`
- Arrow key navigation between options

### Styling

Connected pill shape: first option gets left border-radius, last gets right, middle has none. Uses theme tokens:

- Selected: `--bzn-interactive` bg, `--bzn-text-on-primary` text
- Unselected: `--bzn-surface-raised` bg, `--bzn-text` text
- Border: `--bzn-border`

New component tokens in `_components.scss`:
- `--bzn-button-group-bg`
- `--bzn-button-group-selected`
- `--bzn-button-group-text`
- `--bzn-button-group-text-selected`

## Docs: `ThemeSettings` replaces `ColourSelector`

### Structure

```
<details>
  <summary> [colour circle] Theme Settings </summary>

  <section> Accent colours
    - primary hue slider
    - secondary hue slider + offset presets dropdown
  </section>

  <section> Preferences
    - ButtonGroup: Color scheme (Auto | Light | Dark)
    - ButtonGroup: Reduced motion (Auto | Yes | No)
    - ButtonGroup: Reduced transparency (Auto | Yes | No)
  </section>
</details>
```

### localStorage keys

- `bzn-docs-color-scheme` → `"auto" | "light" | "dark"`
- `bzn-docs-reduced-motion` → `"auto" | "yes" | "no"`
- `bzn-docs-reduced-transparency` → `"auto" | "yes" | "no"`

### CSS class mapping

| Setting | Auto | Yes (force on) | No (force off) |
|---|---|---|---|
| Color scheme | *(no class)* | `.bzn--light` or `.bzn--dark` | opposite |
| Reduced motion | *(no class)* | `.bzn--reduce-motion` | `.bzn--allow-motion` |
| Reduced transparency | *(no class)* | `.bzn--reduce-transparency` | `.bzn--allow-transparency` |

Classes are toggled on `document.documentElement`.

### BaseLayout.astro

The existing inline script that applies hue overrides before hydration will also read the new localStorage keys and apply corresponding classes to prevent flash of wrong theme.

### DocsShell.tsx

Replace `<ColourSelector />` with `<ThemeSettings />`.

## No SCSS changes needed

All required classes (`.bzn--light`, `.bzn--dark`, `.bzn--reduce-motion`, `.bzn--allow-motion`, `.bzn--reduce-transparency`, `.bzn--allow-transparency`) already exist in `_theme.scss` responsive mixin. Only new component tokens for `ButtonGroup` styling are added to `_components.scss`.
