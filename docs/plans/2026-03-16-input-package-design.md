# Input Package Extraction Design

## Goal

Extract the `Input` component from `@bezny/forms` into a new `@bezny/input` package. Create individual typed input components for each HTML input type. Add documentation pages for all input components.

## Package Structure

```
packages/input/
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── src/
    ├── index.ts
    ├── Input.tsx            # Base component (internal, not exported)
    ├── Input.module.scss    # Shared input styles
    ├── TextInput.tsx
    ├── NumberInput.tsx
    ├── DateInput.tsx
    ├── DateTimeInput.tsx    # type="datetime-local"
    ├── TimeInput.tsx
    ├── EmailInput.tsx
    ├── FileInput.tsx
    ├── ImageInput.tsx
    ├── MonthInput.tsx
    ├── YearInput.tsx        # type="number" with year constraints
    ├── PasswordInput.tsx
    ├── SearchInput.tsx
    ├── UrlInput.tsx
    └── WeekInput.tsx
```

## Component Architecture

### Base Input (internal)

Moved from `@bezny/forms`. Handles floating label, validation status display (using `Alert` from `@bezny/alert` instead of `StatusMessage`), and wrapper pattern. Not exported from the package.

### Typed Wrappers

Thin components that fix the `type` prop and omit it from their public props.

**Keyboard-typeable inputs** return `string`:

- `TextInput` — `type="text"`
- `NumberInput` — `type="number"`
- `DateInput` — `type="date"`
- `DateTimeInput` — `type="datetime-local"`
- `TimeInput` — `type="time"`
- `EmailInput` — `type="email"`
- `MonthInput` — `type="month"`
- `YearInput` — `type="number"` with year-appropriate min/max/step defaults
- `PasswordInput` — `type="password"`
- `SearchInput` — `type="search"`
- `UrlInput` — `type="url"`
- `WeekInput` — `type="week"`

All use `onChange: (value: string) => void`.

**Non-keyboard inputs** are type-aware:

- `FileInput` — `type="file"`, `onChange: (files: FileList | null) => void`
- `ImageInput` — `type="file"` with `accept="image/*"`, `onChange: (files: FileList | null) => void`

### YearInput

No native `type="year"` exists. Implemented as `type="number"` with sensible defaults (e.g., `min=1900`, `max=2100`, `step=1`). These defaults are overridable via props.

### FileInput / ImageInput

These differ from keyboard inputs:
- No floating label pattern (file inputs don't support placeholder text)
- Different `onChange` signature returning `FileList | null`
- `ImageInput` adds `accept="image/*"` by default

## Changes to @bezny/forms

- Remove `Input.tsx`, `Input.module.scss`
- Remove `StatusMessage.tsx`, `StatusMessage.module.scss`
- Keep `TextArea.tsx`, `Select.tsx`
- Replace `StatusMessage` usage in TextArea/Select with `Alert` from `@bezny/alert`
- Add `@bezny/alert` as dependency, remove `@bezny/styles` `createPolymorphic` usage (was only for StatusMessage)

## Dependencies

```
@bezny/input → @bezny/alert, @bezny/styles, clsx
@bezny/forms → @bezny/alert, @bezny/styles, clsx
@bezny/docs  → adds @bezny/input
```

## Documentation

One docs page per input component added to the sidebar under Components. Each page follows the existing pattern: title, import statement, examples with LivePreview, API reference table. All input components added to LivePreview scope.
