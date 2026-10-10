---
name: using-scss-tokens
description: Use when creating or changing Bezny SCSS tokens, component styles, typography, or theme overrides. Enforces the foundational, logical, structural, and control token layers and validated Sass-backed CSS references.
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

Interaction colours belong in the logical layer: derive hover/active colours with CSS `color-mix()` using foundational base colours and absolute mixing weights. Do not store hover/active shades as foundational literals. Derived expressions must reference foundational tokens only, so root base-colour overrides propagate at runtime.

“Primitive” is another name for foundational, not an extra layer. Component declarations consume control tokens, not lower layers directly. Do not introduce reverse references, skip layers, or repeat raw design values above the foundational layer. Non-token layout mechanics (such as resetting a margin to zero) need not become design tokens.

## Sass-backed CSS references

Follow [Bulma's separation of reference functions from declaration mixins](https://github.com/jgthms/bulma/blob/main/sass/utilities/css-variables.scss), not an impure registration function.

- `packages/base/src/tokens/_css-properties.scss` builds names, validates references against definition maps, and emits declarations through mixins.
- Layer modules keep private definition maps. Their public Sass variables and domain-specific accessors return CSS `var()` expressions rather than resolved literals.
- Reference functions are pure: no global registry mutation, automatic declaration emission, or dependency on previous registration calls.
- Declaration mixins emit in their caller's scope. Shared layers are emitted at `:root`; component control aliases are emitted on the component selector.
- Unknown map keys and missing Sass exports fail compilation. The emitted-CSS tests still ensure definitions actually reach the stylesheet and exist in each heading's scope.

## Workflow

1. Read `README.md`, `AGENTS.md`, and the existing component and token SCSS before editing. Use meaningful domain or responsibility names; filler names such as `utilities`, `lib`, and `helpers` are forbidden.
2. Reuse existing tokens first. Identify the component property and its structural purpose, then trace it to the logical system and foundational value.
3. Add missing tokens in dependency order. Keep each layer in its own SCSS module; keep control tokens with their component. Add the value or alias to the layer's definition map, then expose a validated accessor or Sass reference variable where needed.
4. Use `rem` for font sizes, line heights, and typography-related icon sizes. Convert source pixel values using the reference ratio of 16 pixels to 1 rem; never set a fixed root font size to force that ratio at runtime.
5. Namespace emitted CSS tokens as `--bezny-foundation-*`, `--bezny-logical-*`, `--bezny-structural-*`, and `--bezny-control-<component>-*`. Use the preceding layer's exported Sass variables or domain-specific accessors for aliases. Do not handwrite `var(--bezny-...)` references or literal-value fallbacks that bypass the chain.
6. Component styles consume their control module's exported Sass variables. Keep selectors scoped through SCSS modules. Include shared defaults once through the package stylesheet and bind control aliases in the component's scope.
7. Document exported tokens and overrides. Override shared CSS aliases on the scope where they are declared (initially `:root`); root-resolved aliases do not recompute automatically in descendant scopes. Sass source modules are currently internal, not published package exports.
8. Test compile failures for unknown keys and missing exports. Test pure imports, scoped declaration emission, and all emitted `var()` usages. Preserve adjacent-layer dependencies, complete references without cycles, all heading levels, scoped control bindings, and rem typography.
9. Build, typecheck, and run relevant tests. Commit each complete functional slice using Conventional Commits.

## Component example

From a component alongside `content/heading-typography.scss`:

```scss
@use "../tokens";
@use "./heading-typography";

.heading {
  @include heading-typography.declarations;
  font-size: heading-typography.$font-size;
}
```

The Sass variable contains `var(--bezny-control-heading-font-size)`, preserving runtime CSS theming. Missing exported variables fail compilation. The shared stylesheet and component mixin emit the corresponding declarations separately.
