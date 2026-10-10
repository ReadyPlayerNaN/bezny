# @bezny/demo

Private Vite application showcasing every currently exported `@bezny/base` component:

- Content: `Main`, `Section`, `Heading`, `HeadingLevelProvider`, `Icon`, and `wrapIcon`, including `useHeadingLevel` and all six heading levels.
- Controls: `Button` and `Submit`, with variants, sizes, disabled/loading states, and a live click counter.
- Standalone inputs: `TextInput`, `TextareaInput`, `CheckboxInput`, `RadioGroupInput`, `RadioInput`, and `ToggleInput`.
- Field presentation: `FieldLabel` and `FieldFeedback`, with help, errors, and accessible associations.
- RHF fields: `TextField`, `EmailField`, `TextareaField`, `CheckboxField`, `RadioField`, and `ToggleField` in a working profile form.

Submit the empty profile form to see validation and focus handling. Fill it in to inspect submitted values; reset restores the defaults. Standalone controls do not require a form provider.

## Development

From the repository root:

```sh
pnpm install
pnpm --filter @bezny/demo dev
```

The dev script builds `@bezny/base` first, then starts the Vite dev server. Open the local URL printed by Vite (normally `http://localhost:5173`). Demo edits update through Vite; rebuild `@bezny/base` after changing its source to refresh the consumed library assets.

## Verification

```sh
pnpm --filter @bezny/base build
pnpm --filter @bezny/demo build
pnpm --filter @bezny/demo typecheck
pnpm --filter @bezny/demo test
```

The root build, typecheck, and test pipelines include this package and build its workspace dependencies automatically.
