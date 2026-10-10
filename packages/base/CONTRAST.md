# Contrast verification

The editorial demo was browsed at `http://localhost:5173/` with an automated browser in explicit light and dark themes. The review covered sign-in, article and page collections, selected rows, an article editor, search/status popovers, creation editors and account dialogs, account/language menus, the command palette, and highlighted bulk-delete actions. Only simulated demo sign-in was used; no real credentials or destructive actions were submitted.

Confirmed failures before the fixes:

| Content/state                        | Light  | Dark   | Minimum |
| ------------------------------------ | ------ | ------ | ------- |
| Entity title, normal row             | 4.55:1 | 3.15:1 | 4.5:1   |
| Entity title, highlighted row        | 3.09:1 | 1.89:1 | 4.5:1   |
| Published badge, highlighted row     | 3.80:1 | 4.17:1 | 4.5:1   |
| Destructive action, highlighted item | 3.37:1 | 3.82:1 | 4.5:1   |
| Light keyboard ring on white         | 1.48:1 | —      | 3:1     |

After rebuilding, the live demo was rechecked in both themes with no text contrast failures in the sampled screens/states. Selected-row links measured **5.31:1 light / 5.03:1 dark**, published badges **5.43:1 / 6.40:1**, and highlighted destructive actions **4.80:1 / 5.06:1**. The Chromium regression also verifies keyboard rings at ≥3:1 on highlighted backgrounds.

## Semantic fixes

- Brand **text** is distinct from brand **fill**. Logical `color-brand-text` derives a darker light-mode text colour from the foundational product colour at an absolute 70% mixing weight, and maps to the light product colour in dark mode. Structural `surface-accent-text` feeds entity-row link accents. Filled buttons, toggles, and selected filter badges still use `color-brand` through `surface-accent`; making those fills pale would break their white labels.
- Logical `color-danger-text` darkens the light-mode red independently of the destructive-button fill. The dark red text primitive is lighter so highlighted destructive menu items remain readable.
- Soft badge backgrounds are opaque, using the same visual tints previously obtained by compositing over default light/dark surfaces. This prevents row hover/focus/selection backgrounds from lowering badge contrast. Critical badges now have an explicit dark soft-background mapping as well.
- The light focus ring is opaque; the dark ring uses a stronger alpha so both meet 3:1 even against the highlighted row background.

## Repeatable checks

```sh
pnpm --filter @bezny/base build
node --test packages/base/test/interaction-contrast.browser.mjs
node --test packages/base/test/theme.browser.mjs
```

These explicit browser checks require Chromium (`chromium`, or set `CHROMIUM_PATH`). The interaction fixture renders published components with the built stylesheet and measures resolved colours in Chromium, including CSS `color-mix()` and alpha compositing. It checks all five badge tones, entity links, normal/selected/keyboard-focused rows, highlighted destructive labels, focus rings, and the unchanged primary/destructive button fills in both themes.

Regular package tests continue checking token compilation, reference completeness, adjacent layers, component behavior, and badge palette contrast. Custom themes, images, gradients, and new surfaces need their own checks. This targeted review is not a claim of complete WCAG conformance; disabled controls were excluded from text contrast checks, and text/non-text contrast was evaluated separately.
