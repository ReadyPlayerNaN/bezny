# Docs Integration & Package Extraction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract navbar/breadcrumb components into standalone packages and add doc pages for card, drawer, dropdown, overlay, navbar, and breadcrumbs.

**Architecture:** Move files from `@bezny/navigation` into two new packages (`@bezny/navbar`, `@bezny/breadcrumbs`), keeping the same vite/tsconfig/package.json patterns used by all other component packages. Update docs' `LivePreview` scope with all new components and write 6 new `.mdx` pages with interactive examples.

**Tech Stack:** React 19, SCSS modules, Vite, Astro/Starlight docs, react-live for LivePreview

---

### Task 1: Create `@bezny/navbar` package

**Files:**
- Create: `packages/navbar/package.json`
- Create: `packages/navbar/tsconfig.json`
- Create: `packages/navbar/vite.config.ts`
- Create: `packages/navbar/src/index.ts`
- Move: `packages/navigation/src/Navbar.tsx` → `packages/navbar/src/Navbar.tsx`
- Move: `packages/navigation/src/Navbar.module.scss` → `packages/navbar/src/Navbar.module.scss`
- Move: `packages/navigation/src/NavbarBrand.tsx` → `packages/navbar/src/NavbarBrand.tsx`
- Move: `packages/navigation/src/NavbarBrand.module.scss` → `packages/navbar/src/NavbarBrand.module.scss`
- Move: `packages/navigation/src/NavbarToggle.tsx` → `packages/navbar/src/NavbarToggle.tsx`
- Move: `packages/navigation/src/NavbarToggle.module.scss` → `packages/navbar/src/NavbarToggle.module.scss`
- Move: `packages/navigation/src/NavbarCollapse.tsx` → `packages/navbar/src/NavbarCollapse.tsx`
- Move: `packages/navigation/src/NavbarCollapse.module.scss` → `packages/navbar/src/NavbarCollapse.module.scss`
- Move: `packages/navigation/src/NavbarContext.ts` → `packages/navbar/src/NavbarContext.ts`

**Step 1: Create package scaffolding**

`packages/navbar/package.json`:
```json
{
	"name": "@bezny/navbar",
	"version": "0.0.0",
	"type": "module",
	"main": "./dist/index.js",
	"types": "./dist/index.d.ts",
	"exports": {
		".": {
			"import": "./dist/index.js",
			"types": "./dist/index.d.ts"
		},
		"./index.css": "./dist/index.css"
	},
	"scripts": {
		"build": "vite build",
		"dev": "vite build --watch",
		"lint": "biome check .",
		"lint:fix": "biome check --write .",
		"test": "vitest run",
		"typecheck": "tsc --noEmit -p tsconfig.json"
	},
	"peerDependencies": {
		"react": "^19"
	},
	"dependencies": {
		"@bezny/styles": "workspace:*",
		"clsx": "catalog:"
	},
	"devDependencies": {
		"@types/react": "catalog:",
		"@vitejs/plugin-react": "catalog:",
		"react": "catalog:",
		"sass": "catalog:",
		"typescript": "catalog:",
		"vite": "catalog:",
		"vite-plugin-dts": "catalog:"
	}
}
```

`packages/navbar/tsconfig.json`:
```json
{
	"extends": "../../tsconfig.base.json",
	"compilerOptions": {
		"outDir": "dist",
		"rootDir": "src",
		"lib": ["ES2022", "DOM"],
		"jsx": "react-jsx"
	},
	"include": ["src"]
}
```

`packages/navbar/vite.config.ts`:
```ts
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	plugins: [react(), dts({ include: ["src"] })],
	css: {
		preprocessorOptions: {
			scss: {
				loadPaths: [resolve(import.meta.dirname, "../styles/src")],
			},
		},
	},
	build: {
		cssCodeSplit: true,
		lib: {
			entry: {
				index: resolve(import.meta.dirname, "src/index.ts"),
			},
			formats: ["es"],
		},
		rollupOptions: {
			external: ["react", "react-dom", "clsx"],
			output: {
				assetFileNames: "[name][extname]",
			},
		},
	},
});
```

**Step 2: Move source files**

```bash
mkdir -p packages/navbar/src
cp packages/navigation/src/Navbar.tsx packages/navbar/src/Navbar.tsx
cp packages/navigation/src/Navbar.module.scss packages/navbar/src/Navbar.module.scss
cp packages/navigation/src/NavbarBrand.tsx packages/navbar/src/NavbarBrand.tsx
cp packages/navigation/src/NavbarBrand.module.scss packages/navbar/src/NavbarBrand.module.scss
cp packages/navigation/src/NavbarToggle.tsx packages/navbar/src/NavbarToggle.tsx
cp packages/navigation/src/NavbarToggle.module.scss packages/navbar/src/NavbarToggle.module.scss
cp packages/navigation/src/NavbarCollapse.tsx packages/navbar/src/NavbarCollapse.tsx
cp packages/navigation/src/NavbarCollapse.module.scss packages/navbar/src/NavbarCollapse.module.scss
cp packages/navigation/src/NavbarContext.ts packages/navbar/src/NavbarContext.ts
```

**Step 3: Fix imports in moved files**

In `packages/navbar/src/NavbarToggle.tsx`, the import `from "./NavbarContext"` stays the same (relative, still in same package). Same for `NavbarCollapse.tsx`. No import changes needed — all internal imports are relative within the same `src/` directory.

**Step 4: Write index.ts**

`packages/navbar/src/index.ts`:
```ts
export * from "./Navbar";
export * from "./NavbarBrand";
export * from "./NavbarCollapse";
export * from "./NavbarContext";
export * from "./NavbarToggle";
```

**Step 5: Verify build**

Run: `cd packages/navbar && pnpm install && pnpm build`
Expected: Clean build with `dist/index.js`, `dist/index.css`

**Step 6: Commit**

```bash
git add packages/navbar/
git commit -m "feat(navbar): create @bezny/navbar package extracted from navigation"
```

---

### Task 2: Create `@bezny/breadcrumbs` package

**Files:**
- Create: `packages/breadcrumbs/package.json`
- Create: `packages/breadcrumbs/tsconfig.json`
- Create: `packages/breadcrumbs/vite.config.ts`
- Create: `packages/breadcrumbs/src/index.ts`
- Move: `packages/navigation/src/Breadcrumbs.tsx` → `packages/breadcrumbs/src/Breadcrumbs.tsx`
- Move: `packages/navigation/src/Breadcrumbs.module.scss` → `packages/breadcrumbs/src/Breadcrumbs.module.scss`

**Step 1: Create package scaffolding**

`packages/breadcrumbs/package.json`:
```json
{
	"name": "@bezny/breadcrumbs",
	"version": "0.0.0",
	"type": "module",
	"main": "./dist/index.js",
	"types": "./dist/index.d.ts",
	"exports": {
		".": {
			"import": "./dist/index.js",
			"types": "./dist/index.d.ts"
		},
		"./index.css": "./dist/index.css"
	},
	"scripts": {
		"build": "vite build",
		"dev": "vite build --watch",
		"lint": "biome check .",
		"lint:fix": "biome check --write .",
		"test": "vitest run",
		"typecheck": "tsc --noEmit -p tsconfig.json"
	},
	"peerDependencies": {
		"react": "^19"
	},
	"dependencies": {
		"@bezny/styles": "workspace:*",
		"clsx": "catalog:"
	},
	"devDependencies": {
		"@types/react": "catalog:",
		"@vitejs/plugin-react": "catalog:",
		"react": "catalog:",
		"sass": "catalog:",
		"typescript": "catalog:",
		"vite": "catalog:",
		"vite-plugin-dts": "catalog:"
	}
}
```

`packages/breadcrumbs/tsconfig.json`:
```json
{
	"extends": "../../tsconfig.base.json",
	"compilerOptions": {
		"outDir": "dist",
		"rootDir": "src",
		"lib": ["ES2022", "DOM"],
		"jsx": "react-jsx"
	},
	"include": ["src"]
}
```

`packages/breadcrumbs/vite.config.ts` — same as navbar's vite.config.ts (identical content).

**Step 2: Move source files**

```bash
mkdir -p packages/breadcrumbs/src
cp packages/navigation/src/Breadcrumbs.tsx packages/breadcrumbs/src/Breadcrumbs.tsx
cp packages/navigation/src/Breadcrumbs.module.scss packages/breadcrumbs/src/Breadcrumbs.module.scss
```

**Step 3: Write index.ts**

`packages/breadcrumbs/src/index.ts`:
```ts
export * from "./Breadcrumbs";
```

Note: Both `Breadcrumbs` and `BreadcrumbItem` are exported from `Breadcrumbs.tsx` — single file contains both components.

**Step 4: Verify build**

Run: `cd packages/breadcrumbs && pnpm install && pnpm build`
Expected: Clean build with `dist/index.js`, `dist/index.css`

**Step 5: Commit**

```bash
git add packages/breadcrumbs/
git commit -m "feat(breadcrumbs): create @bezny/breadcrumbs package extracted from navigation"
```

---

### Task 3: Trim `@bezny/navigation`

**Files:**
- Modify: `packages/navigation/src/index.ts`
- Delete: `packages/navigation/src/Navbar.tsx`
- Delete: `packages/navigation/src/Navbar.module.scss`
- Delete: `packages/navigation/src/NavbarBrand.tsx`
- Delete: `packages/navigation/src/NavbarBrand.module.scss`
- Delete: `packages/navigation/src/NavbarToggle.tsx`
- Delete: `packages/navigation/src/NavbarToggle.module.scss`
- Delete: `packages/navigation/src/NavbarCollapse.tsx`
- Delete: `packages/navigation/src/NavbarCollapse.module.scss`
- Delete: `packages/navigation/src/NavbarContext.ts`
- Delete: `packages/navigation/src/Breadcrumbs.tsx`
- Delete: `packages/navigation/src/Breadcrumbs.module.scss`

**Step 1: Update index.ts**

Replace `packages/navigation/src/index.ts` with:
```ts
export * from "./Link";
export * from "./Nav";
export * from "./NavLink";
export * from "./Sidebar";
```

**Step 2: Delete extracted files**

```bash
rm packages/navigation/src/Navbar.tsx
rm packages/navigation/src/Navbar.module.scss
rm packages/navigation/src/NavbarBrand.tsx
rm packages/navigation/src/NavbarBrand.module.scss
rm packages/navigation/src/NavbarToggle.tsx
rm packages/navigation/src/NavbarToggle.module.scss
rm packages/navigation/src/NavbarCollapse.tsx
rm packages/navigation/src/NavbarCollapse.module.scss
rm packages/navigation/src/NavbarContext.ts
rm packages/navigation/src/Breadcrumbs.tsx
rm packages/navigation/src/Breadcrumbs.module.scss
```

**Step 3: Verify build**

Run: `cd packages/navigation && pnpm build`
Expected: Clean build — remaining components (Link, Nav, NavLink, Sidebar) have no imports from deleted files. Note: `Sidebar` imports `NavLink` which is still in the package.

**Step 4: Commit**

```bash
git add packages/navigation/
git commit -m "refactor(navigation): remove extracted navbar and breadcrumb components"
```

---

### Task 4: Update docs dependencies and LivePreview scope

**Files:**
- Modify: `packages/docs/package.json`
- Modify: `packages/docs/src/components/LivePreview.tsx`

**Step 1: Add new workspace deps to docs package.json**

Add these to the `dependencies` object in `packages/docs/package.json`:
```json
"@bezny/breadcrumbs": "workspace:*",
"@bezny/card": "workspace:*",
"@bezny/drawer": "workspace:*",
"@bezny/dropdown": "workspace:*",
"@bezny/navbar": "workspace:*",
"@bezny/overlay": "workspace:*",
```

**Step 2: Update LivePreview scope**

In `packages/docs/src/components/LivePreview.tsx`, add imports and scope entries:

```tsx
import { Alert } from "@bezny/alert";
import { Avatar, AvatarStack } from "@bezny/avatar";
import { Breadcrumbs, BreadcrumbItem } from "@bezny/breadcrumbs";
import { Button, Submit } from "@bezny/button";
import { Card, CardBody, CardFooter, CardHeader, CardImg } from "@bezny/card";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@bezny/dialog";
import { Drawer } from "@bezny/drawer";
import { Dropdown } from "@bezny/dropdown";
import { Article, Aside, Container, Main, Section, Stack } from "@bezny/layout";
import { Navbar, NavbarBrand, NavbarCollapse, NavbarToggle } from "@bezny/navbar";
import { Overlay } from "@bezny/overlay";
import {
	Heading,
	HeadingLevelProvider,
	Label,
	Paragraph,
	StaticHeading,
} from "@bezny/text";
import React from "react";
import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";

const scope = {
	Alert,
	Article,
	Aside,
	Avatar,
	AvatarStack,
	BreadcrumbItem,
	Breadcrumbs,
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	CardImg,
	Container,
	Dialog,
	DialogBody,
	DialogFooter,
	DialogHeader,
	Drawer,
	Dropdown,
	Heading,
	HeadingLevelProvider,
	Label,
	Main,
	Navbar,
	NavbarBrand,
	NavbarCollapse,
	NavbarToggle,
	Overlay,
	Paragraph,
	React,
	Section,
	Stack,
	StaticHeading,
	Submit,
};
```

**Step 3: Install deps**

Run: `pnpm install`

**Step 4: Commit**

```bash
git add packages/docs/package.json packages/docs/src/components/LivePreview.tsx pnpm-lock.yaml
git commit -m "feat(docs): add card, drawer, dropdown, overlay, navbar, breadcrumbs deps and LivePreview scope"
```

---

### Task 5: Write doc pages for card, drawer, dropdown, overlay

**Files:**
- Create: `packages/docs/src/content/docs/components/card.mdx`
- Create: `packages/docs/src/content/docs/components/drawer.mdx`
- Create: `packages/docs/src/content/docs/components/dropdown.mdx`
- Create: `packages/docs/src/content/docs/components/overlay.mdx`

**Step 1: Write card.mdx**

`packages/docs/src/content/docs/components/card.mdx`:
```mdx
---
title: Card
---

import LivePreview from "../../../components/LivePreview";

A compound card component with header, body, footer, and image sections.

\`\`\`tsx
import { Card } from "@bezny/card";
\`\`\`

## Examples

### Basic Card

<LivePreview client:load code={`<Card>
  <Card.Header>Card Title</Card.Header>
  <Card.Body>This is the card body content.</Card.Body>
  <Card.Footer>Footer actions</Card.Footer>
</Card>`} />

### Card with Image

<LivePreview client:load code={`<Card>
  <Card.Img src="https://picsum.photos/seed/card/600/200" alt="Sample" position="top" />
  <Card.Body>Card content below the image.</Card.Body>
</Card>`} />

### Multiple Cards

<LivePreview client:load code={`<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
  <Card>
    <Card.Header>First</Card.Header>
    <Card.Body>First card content</Card.Body>
  </Card>
  <Card>
    <Card.Header>Second</Card.Header>
    <Card.Body>Second card content</Card.Body>
  </Card>
  <Card>
    <Card.Header>Third</Card.Header>
    <Card.Body>Third card content</Card.Body>
  </Card>
</div>`} />

## API Reference

### Card

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes (clsx-compatible) |
| `children` | `ReactNode` | — | Card content |

### Card.Header

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `children` | `ReactNode` | — | Header content |

### Card.Body

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `children` | `ReactNode` | — | Body content |

### Card.Footer

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `children` | `ReactNode` | — | Footer content |

### Card.Img

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | **required** | Image source URL |
| `alt` | `string` | **required** | Image alt text |
| `position` | `"top" \| "bottom" \| "overlay"` | `"top"` | Image placement |
| `height` | `number \| string` | `160` | Image height (ignored for overlay) |
| `className` | `ClassValue` | — | Additional CSS classes |
```

**Step 2: Write drawer.mdx**

`packages/docs/src/content/docs/components/drawer.mdx`:
```mdx
---
title: Drawer
---

import LivePreview from "../../../components/LivePreview";

A slide-in panel with overlay backdrop, focus trapping, and Escape key support.

\`\`\`tsx
import { Drawer } from "@bezny/drawer";
\`\`\`

## Examples

### Right Drawer (Default)

<LivePreview client:load noInline code={`function DrawerDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Drawer</Button>
      <Drawer open={open} onClose={() => setOpen(false)}>
        <Heading>Drawer Content</Heading>
        <Paragraph>This drawer slides in from the right.</Paragraph>
      </Drawer>
    </div>
  );
}
render(<DrawerDemo />);`} />

### Left Drawer

<LivePreview client:load noInline code={`function DrawerDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Left Drawer</Button>
      <Drawer open={open} onClose={() => setOpen(false)} side="left">
        <Heading>Left Drawer</Heading>
        <Paragraph>This drawer slides in from the left.</Paragraph>
      </Drawer>
    </div>
  );
}
render(<DrawerDemo />);`} />

## API Reference

### Drawer

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | **required** | Controls drawer visibility |
| `onClose` | `() => void` | **required** | Called on Escape press or outside click |
| `side` | `"left" \| "right"` | `"right"` | Which side the drawer slides from |
| `className` | `ClassValue` | — | Additional CSS classes (clsx-compatible) |
| `children` | `ReactNode` | — | Drawer content |
```

**Step 3: Write dropdown.mdx**

`packages/docs/src/content/docs/components/dropdown.mdx`:
```mdx
---
title: Dropdown
---

import LivePreview from "../../../components/LivePreview";

A positioned dropdown panel anchored to a trigger element with Escape and outside-click dismissal.

\`\`\`tsx
import { Dropdown } from "@bezny/dropdown";
\`\`\`

## Examples

### Basic Dropdown

<LivePreview client:load noInline code={`function DropdownDemo() {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  return (
    <div>
      <Button ref={anchorRef} onClick={() => setOpen(!open)}>Toggle Dropdown</Button>
      <Dropdown open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
        <div style={{ padding: "8px", minWidth: "150px" }}>
          <Paragraph>Dropdown content</Paragraph>
        </div>
      </Dropdown>
    </div>
  );
}
render(<DropdownDemo />);`} />

### Left-Aligned Dropdown

<LivePreview client:load noInline code={`function DropdownDemo() {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  return (
    <div>
      <Button ref={anchorRef} onClick={() => setOpen(!open)}>Left Aligned</Button>
      <Dropdown open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} align="left">
        <div style={{ padding: "8px", minWidth: "150px" }}>
          <Paragraph>Aligned to the left edge of the trigger.</Paragraph>
        </div>
      </Dropdown>
    </div>
  );
}
render(<DropdownDemo />);`} />

## API Reference

### Dropdown

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | **required** | Controls dropdown visibility |
| `onClose` | `() => void` | **required** | Called on Escape press or outside click |
| `anchorRef` | `RefObject<HTMLElement \| null>` | **required** | Ref to the anchor/trigger element |
| `align` | `"left" \| "right"` | `"right"` | Horizontal alignment relative to anchor |
| `className` | `ClassValue` | — | Additional CSS classes (clsx-compatible) |
| `children` | `ReactNode` | — | Dropdown content |
```

**Step 4: Write overlay.mdx**

`packages/docs/src/content/docs/components/overlay.mdx`:
```mdx
---
title: Overlay
---

import LivePreview from "../../../components/LivePreview";

A backdrop overlay rendered via portal, used as a building block for modals and drawers.

\`\`\`tsx
import { Overlay } from "@bezny/overlay";
\`\`\`

## Examples

### Basic Overlay

<LivePreview client:load noInline code={`function OverlayDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Show Overlay</Button>
      <Overlay open={open} onClick={() => setOpen(false)}>
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "var(--sl-color-bg)", padding: "24px", borderRadius: "8px" }}>
          <Heading>Overlay Content</Heading>
          <Paragraph>Click the backdrop to close.</Paragraph>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </Overlay>
    </div>
  );
}
render(<OverlayDemo />);`} />

## API Reference

### Overlay

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | **required** | Controls overlay visibility |
| `className` | `ClassValue` | — | Additional CSS classes (clsx-compatible) |
| `children` | `ReactNode` | — | Content rendered inside the overlay portal |
| `...rest` | `ComponentPropsWithoutRef<"div">` | — | All other native div attributes |
```

**Step 5: Commit**

```bash
git add packages/docs/src/content/docs/components/card.mdx packages/docs/src/content/docs/components/drawer.mdx packages/docs/src/content/docs/components/dropdown.mdx packages/docs/src/content/docs/components/overlay.mdx
git commit -m "docs: add card, drawer, dropdown, overlay component pages"
```

---

### Task 6: Write doc pages for navbar and breadcrumbs

**Files:**
- Create: `packages/docs/src/content/docs/components/navbar.mdx`
- Create: `packages/docs/src/content/docs/components/breadcrumbs.mdx`

**Step 1: Write navbar.mdx**

`packages/docs/src/content/docs/components/navbar.mdx`:
```mdx
---
title: Navbar
---

import LivePreview from "../../../components/LivePreview";

A responsive navigation bar with collapsible sections and toggle support.

\`\`\`tsx
import { Navbar, NavbarBrand, NavbarToggle, NavbarCollapse } from "@bezny/navbar";
\`\`\`

## Examples

### Basic Navbar

<LivePreview client:load noInline code={`function NavbarDemo() {
  return (
    <Navbar>
      <NavbarBrand href="#">My App</NavbarBrand>
      <NavbarToggle />
      <NavbarCollapse>
        <div style={{ display: "flex", gap: "16px", padding: "8px 0" }}>
          <a href="#">Home</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </div>
      </NavbarCollapse>
    </Navbar>
  );
}
render(<NavbarDemo />);`} />

### Controlled Navbar

<LivePreview client:load noInline code={`function NavbarDemo() {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <Navbar expanded={expanded} onToggle={setExpanded}>
      <NavbarBrand href="#">Brand</NavbarBrand>
      <NavbarToggle />
      <NavbarCollapse>
        <div style={{ display: "flex", gap: "16px", padding: "8px 0" }}>
          <a href="#">Link A</a>
          <a href="#">Link B</a>
        </div>
      </NavbarCollapse>
    </Navbar>
  );
}
render(<NavbarDemo />);`} />

## API Reference

### Navbar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `expanded` | `boolean` | — | Controlled expanded state |
| `onToggle` | `(expanded: boolean) => void` | — | Called when toggle is clicked (controlled mode) |
| `className` | `ClassValue` | — | Additional CSS classes (clsx-compatible) |
| `children` | `ReactNode` | — | Navbar content |

### NavbarBrand

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | — | Renders as `<a>` when provided, `<span>` otherwise |
| `className` | `ClassValue` | — | Additional CSS classes |
| `children` | `ReactNode` | — | Brand content |

### NavbarToggle

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `children` | `ReactNode` | — | Custom toggle content (defaults to hamburger icon) |

### NavbarCollapse

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `children` | `ReactNode` | — | Collapsible content |
```

**Step 2: Write breadcrumbs.mdx**

`packages/docs/src/content/docs/components/breadcrumbs.mdx`:
```mdx
---
title: Breadcrumbs
---

import LivePreview from "../../../components/LivePreview";

A breadcrumb navigation component that automatically marks the last item as the current page.

\`\`\`tsx
import { Breadcrumbs, BreadcrumbItem } from "@bezny/breadcrumbs";
\`\`\`

## Examples

### Basic Breadcrumbs

<LivePreview client:load code={`<Breadcrumbs>
  <BreadcrumbItem><a href="#">Home</a></BreadcrumbItem>
  <BreadcrumbItem><a href="#">Products</a></BreadcrumbItem>
  <BreadcrumbItem>Current Page</BreadcrumbItem>
</Breadcrumbs>`} />

### Two Levels

<LivePreview client:load code={`<Breadcrumbs>
  <BreadcrumbItem><a href="#">Dashboard</a></BreadcrumbItem>
  <BreadcrumbItem>Settings</BreadcrumbItem>
</Breadcrumbs>`} />

## API Reference

### Breadcrumbs

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes (clsx-compatible) |
| `children` | `ReactNode` | — | BreadcrumbItem elements |

### BreadcrumbItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes (clsx-compatible) |
| `children` | `ReactNode` | — | Item content |
```

**Step 3: Commit**

```bash
git add packages/docs/src/content/docs/components/navbar.mdx packages/docs/src/content/docs/components/breadcrumbs.mdx
git commit -m "docs: add navbar and breadcrumbs component pages"
```

---

### Task 7: Verify full build

**Step 1: Run full workspace build**

Run: `pnpm build`
Expected: All packages build successfully including the new `@bezny/navbar` and `@bezny/breadcrumbs`.

**Step 2: Run dev server**

Run: `pnpm dev`
Expected: Astro dev server starts, new doc pages are visible in sidebar under Components, LivePreview examples render correctly.

**Step 3: Fix any issues found**

If build or dev server fails, diagnose and fix. Common issues:
- Missing `pnpm install` after adding workspace deps
- SCSS `@use` paths not resolving (check vite.config.ts `loadPaths`)
- LivePreview scope missing a component

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address build issues from docs integration"
```
