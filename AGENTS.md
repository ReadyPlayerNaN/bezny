# Agent instructions

## Project purpose

Bezny is a UI framework for building admin interfaces, using React and TypeScript. Use this purpose to guide implementation and design decisions.

## Component behavior

- Build interactive components on top of Radix Primitives when a suitable primitive exists. Radix is the framework's behavioral foundation; do not independently recreate behavior already supplied by the primitive.
- Let Radix handle supported interaction behavior such as keyboard navigation, focus management, dismissal, portals, state, and accessibility semantics. Preserve its required structure, props, refs, and event composition when wrapping it.
- Bezny owns the public component API, composition, SCSS modules, and four-layer tokens. Style and wrap Radix primitives as Bezny components.
- Keep native HTML for straightforward headings, icons, and buttons when a Radix wrapper would add no behavior. Consider Radix Slot for an intentional `asChild` API; it composes props and refs but does not provide button behavior.
- Add only the Radix dependencies needed by the component being implemented, in the package that consumes them. Do not install speculative dependencies or migrate existing APIs without an implementation task.
- Check the chosen primitive's documentation before integration. Test keyboard interactions, focus behavior, controlled/uncontrolled state where supported, and accessible semantics—not only rendered markup.

## Forms

- Use React Hook Form (`react-hook-form`) for form state, field registration, validation integration, and submission handling. It is installed in `@bezny/base`.
- Use `register` for compatible native inputs and `Controller` or `useController` for controlled fields, including Radix-based controls. Forward field names, refs, values, and change/blur handlers correctly.
- Keep Radix interaction behavior separate from React Hook Form's form state. Bezny provides field composition, styling, labels, and accessible error presentation.
- Test field updates, validation errors, submission, and focus/ref integration when implementing forms.

## Meaningful naming

- Use meaningful names for everything: files, directories, modules, variables, functions, types, and components. Names must communicate their domain, responsibility, or purpose.
- Meaningless filler names such as `utilities`, `lib`, or `helpers` are forbidden. Name code for what it does, not for being a miscellaneous collection.

## SCSS tokens

- Use four layers: **Foundational → Logical → Structural → Control**.
- Foundational tokens define absolute primitive values; they do not reference other tokens.
- Logical tokens reference foundational tokens only, grouping primitives into a system.
- Structural tokens reference logical tokens only, giving system values purpose.
- Control tokens belong to components and reference structural tokens only. Component styles consume control tokens.
- Do not skip layers, create reverse dependencies, or place raw design values in higher layers. “Primitive” means foundational, not a fifth layer.
- Use `rem` for typography: font sizes, line heights, and typography-related icon sizes. Do not force a fixed root font size.
- Use exported Sass variables and validated, domain-specific token accessors to obtain CSS `var()` values. Do not handwrite `var(--bezny-...)` references in SCSS source.
- Follow Bulma's separation of responsibilities: pure functions build references; declaration mixins emit CSS in the caller's scope. Do not mutate a global token registry inside a function.
- Before adding or changing tokens or token-consuming styles, read `.agents/skills/using-scss-tokens/SKILL.md` and follow its workflow.

> Structure cannot stand without its foundations. Logic is a foundation of function. Function is the essence of control

## Functional slices and commits

- All work must be divided into functional slices. Each slice must deliver a complete, independently usable functional improvement to the source code—not a partial implementation or an arbitrary batch of files.
- Include the implementation, relevant tests, and any necessary configuration or documentation in the same slice. For documentation-only tasks, the slice must deliver a complete, usable documentation improvement.
- Verify each slice with the relevant checks before committing it. Do not commit incomplete or failing slices.
- Commit each completed slice separately using Conventional Commits: `type(scope): description` (scope is optional), for example `feat(core): add input validation` or `docs: define agent workflow`.
- Finish and commit the current slice before starting the next. Do not combine unrelated improvements in one commit or include unrelated pre-existing changes.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm exec ultracite fix`
- **Check for issues**: `pnpm exec ultracite check`
- **Diagnose setup**: `pnpm exec ultracite doctor`

Oxlint + Oxfmt (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)

### React 19+ Guidance

- Use ref as a prop instead of `React.forwardRef`

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Oxlint + Oxfmt Can't Help

Oxlint + Oxfmt will catch most mechanical issues automatically. Focus your attention on:

1. **Business logic correctness** - Oxlint + Oxfmt can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Oxlint + Oxfmt. Run `pnpm exec ultracite fix` before committing to ensure compliance.
