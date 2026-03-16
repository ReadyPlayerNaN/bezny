# `asChild` Polymorphic Component Design

## Problem

Components render fixed HTML elements. There's no way to:
- Render a Button as a router Link
- Render a Card as an `<article>` or `<section>`
- Wrap third-party components with design system styling

## Solution

A `createPolymorphic` factory function in `@bezny/styles` that wraps component creation and adds a typed `asChild` prop.

## API

### `asChild` prop

Accepts either an HTML tag name (`"a"`, `"article"`) or a React component (`RouterLink`, `CustomButton`). The component renders the given tag/component instead of its default element, passing all computed props through.

### Consumer usage

```tsx
// Default — renders <button>
<Button variant="primary">Click</Button>

// As an anchor tag — href becomes available
<Button asChild="a" href="/home" variant="primary">Go home</Button>

// As a React component — component's props become available
<Button asChild={RouterLink} to="/home" variant="primary">Go home</Button>

// Card as article
<Card asChild="article">Semantic content</Card>
```

### Component author usage

```tsx
import { createPolymorphic } from "@bezny/styles";

type ButtonOwnProps = {
  className?: ClassValue;
  variant?: ButtonVariant;
};

export const Button = createPolymorphic<"button", ButtonOwnProps>(
  "button",
  (Tag, { className, variant = "default" }, rest) => (
    <Tag
      className={clsx(styles.button, variantClassMap[variant], className)}
      {...rest}
    />
  ),
);
```

## Implementation: `createPolymorphic`

Location: `packages/styles/src/createPolymorphic.tsx`

### Types

```tsx
type AsChild = keyof JSX.IntrinsicElements | ComponentType<any>;

type PolymorphicProps<
  DefaultTag extends ElementType,
  OwnProps,
  T extends AsChild = DefaultTag & AsChild,
> = OwnProps &
  { asChild?: T } &
  Omit<
    T extends keyof JSX.IntrinsicElements
      ? ComponentPropsWithoutRef<T>
      : T extends ComponentType<infer P> ? P : never,
    keyof OwnProps | "asChild"
  >;
```

### Factory function

The factory takes:
1. `defaultTag` — the default HTML element to render (e.g., `"button"`)
2. `render` — a function receiving `(Tag, ownProps, restProps)` that returns JSX

It returns a generic component that:
- Accepts `asChild` to override the rendered element
- Provides TypeScript inference for the target element/component's props
- Splits own props from pass-through props

### Design decisions

1. **No prop merging**: The rendered tag/component receives all props. The child is responsible for reconciling conflicts (e.g., className).
2. **Type-safe**: `asChild="a"` enables anchor props (`href`, `target`). `asChild={RouterLink}` enables that component's props. Invalid props produce type errors.
3. **Opt-in**: Components that don't benefit from polymorphism (e.g., `CardImg`) stay as plain functions.
4. **Default behavior preserved**: Without `asChild`, components work exactly as before.

## Scope

### Components to migrate

All components that render a single root element:

- **button**: Button, Submit
- **alert**: Alert
- **card**: Card, CardHeader, CardBody, CardFooter
- **text**: Heading, Paragraph, Label
- **navigation**: Link, NavLink, Navbar, NavbarBrand, Breadcrumbs, Sidebar
- **forms**: Input, Select, Checkbox, Switch, Radio, TextArea
- **data**: List
- **dialog**: Dialog, DialogHeader, DialogBody, DialogFooter
- **drawer**: Drawer
- **dropdown**: Dropdown
- **avatar**: Avatar
- **overlay**: Overlay
- **layout**: Stack, Container, Aside, Main, Article, Section

### Components to skip

- **CardImg** — wraps an `<img>` inside a `<div>`, polymorphism doesn't apply
- **HeadingLevelProvider** — context provider, not a visual component
- **NavbarToggle, NavbarCollapse** — internal compound components with specific semantics

## Migration strategy

1. Implement `createPolymorphic` in `@bezny/styles`
2. Export it from the package
3. Migrate components one package at a time
4. Each migration should be a drop-in replacement — no breaking changes to existing API
