---
name: using-scss-tokens
description: Use when creating or changing Bezny SCSS tokens, component styles, typography, or theme overrides. Enforces the foundational, logical, structural, and control token layers.
---

# Using SCSS tokens

Bezny is a React and TypeScript UI framework for admin interfaces. This skill belongs to this project only.

> Structure cannot stand without its foundations. Logic is a foundation of function. Function is the essence of control

## Four layers

Dependencies flow **Foundational → Logical → Structural → Control**.

1. **Foundational tokens** define primitive, absolute values. They reference no other tokens.
2. **Logical tokens** reference foundational tokens only, grouping primitives into a system such as a type scale.
3. **Structural tokens** reference logical tokens only, giving system values purpose such as heading typography.
4. **Control tokens** belong to components and reference structural tokens only, applying those values to the control.

“Primitive” is another name for foundational, not an extra layer. Component declarations consume control tokens, not lower layers directly. Do not introduce reverse references, skip layers, or repeat raw design values above the foundational layer. Non-token layout mechanics (such as resetting a margin to zero) need not become design tokens.

## Workflow

1. Read `README.md`, `AGENTS.md`, and the existing component and token SCSS before editing.
2. Reuse existing tokens first. Identify the component property and its structural purpose, then trace it to the logical system and foundational value.
3. Add missing tokens in dependency order. Keep each layer in its own SCSS module; keep control tokens with their component.
4. Use `rem` for font sizes, line heights, and typography-related icon sizes. Convert source pixel values using the reference ratio of 16 pixels to 1 rem; never set a fixed root font size to force that ratio at runtime.
5. For CSS custom properties, namespace tokens as `--bezny-foundation-*`, `--bezny-logical-*`, `--bezny-structural-*`, and `--bezny-control-<component>-*`. Use `var()` aliases between adjacent layers, without literal-value fallbacks that bypass the chain.
6. Keep component selectors scoped through SCSS modules. Emit shared defaults once through the package stylesheet. Bind control aliases in the component's scope so structural values are consumed there.
7. Document exported tokens and overrides. When overriding shared CSS aliases, set the override on the scope where the aliases are declared (initially `:root`); do not promise that root-resolved aliases will recompute in descendant scopes.
8. Test the emitted CSS: absolute values only in foundational definitions, references only to the adjacent layer, complete references without cycles, all heading levels, scoped control bindings, and no pixel typography.
9. Build, typecheck, and run relevant tests. Commit each complete functional slice using Conventional Commits.

## Example

```scss
:root {
  --bezny-foundation-size-16: 1rem;
  --bezny-logical-font-size-sm: var(--bezny-foundation-size-16);
  --bezny-structural-heading-5-font-size: var(--bezny-logical-font-size-sm);
}

.heading {
  --bezny-control-heading-font-size: var(
    --bezny-structural-heading-5-font-size
  );
  font-size: var(--bezny-control-heading-font-size);
}
```

This illustrates one property; a full component follows the same chain for every design-token property it uses.
