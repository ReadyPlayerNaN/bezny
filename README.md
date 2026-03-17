# bezny

A React component library with a CSS custom property theming system. Work in progress.

## Packages

| Package | Description |
|---|---|
| `@bezny/core` | Theme tokens, SCSS mixins, `createPolymorphic` utility |
| `@bezny/alert` | Alert and notification messages |
| `@bezny/avatar` | Avatar and AvatarStack |
| `@bezny/button` | Button and Submit |
| `@bezny/card` | Card container |
| `@bezny/dialog` | Modal dialog |
| `@bezny/drawer` | Slide-in drawer panel |
| `@bezny/dropdown` | Dropdown menu |
| `@bezny/feedback` | RemoteDataView and StatusMessage for async state |
| `@bezny/forms` | Select and TextArea |
| `@bezny/input` | Text, Email, Password, Number, Date, File, and more |
| `@bezny/layout` | Article, Aside, Container, Main, Section, Stack |
| `@bezny/list` | List, ListColumn, ListActions |
| `@bezny/navbar` | Navbar and its sub-components |
| `@bezny/navigation` | Breadcrumbs, Nav, NavLink, Sidebar |
| `@bezny/overlay` | Backdrop overlay |
| `@bezny/switches` | Checkbox, Radio, Switch, ButtonGroup |
| `@bezny/text` | Heading, Paragraph, Label, Link |

## Requirements

- React 19+
- A bundler that handles CSS imports (Vite, Next.js, etc.)

## Installation

Install the packages you need:

```sh
pnpm add @bezny/button @bezny/core
```

Import the default theme and component styles in your app entry point:

```css
@import "@bezny/core/theme.css";
@import "@bezny/button/index.css";
```

Use the components:

```tsx
import { Button } from "@bezny/button";

<Button variant="primary">Click me</Button>
```

## Theming

The theming system has three tiers: primitive color scales → semantic roles → component tokens. All tiers are CSS custom properties, so you can override any layer in your own CSS.

To generate a custom theme from your brand color:

```scss
@use "@bezny/core" as bzn;

:root {
  @include bzn.theme($primary: oklch(55% 0.2 260));
}
```

The mixin derives a full color system — including dark mode, high contrast, reduced motion, and reduced transparency variants — from the primary color.

## Development

```sh
pnpm install
pnpm build     # build all packages
pnpm test      # run tests
pnpm lint      # lint
pnpm dev       # start the docs site at localhost:4300
```

## License

MIT
