---
title: Getting Started
---

bezny is a React component framework built on a shared design system with CSS custom properties.

## Installation

```bash
pnpm add @bezny/button @bezny/styles
```

## Setup

Import the default theme CSS in your application entry point:

```css
@import "@bezny/styles/theme.css";
@import "@bezny/button/index.css";
```

To create a custom theme instead, see the [Theming](/theming/overview/) guide.

## Usage

```tsx
import { Button } from "@bezny/button";

function App() {
  return <Button variant="primary">Click me</Button>;
}
```
