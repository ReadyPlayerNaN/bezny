# Starlight Docs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Docusaurus-based `@bezny/docs` with a Starlight (Astro + Vite) docs site featuring editable live component previews.

**Architecture:** Astro + Starlight for the docs framework, `@astrojs/react` for React island support, `react-live` for editable live previews. A custom `<LivePreview>` React component wraps react-live and is used as a client island in MDX. Component styles and theme CSS are loaded globally via Starlight's `customCss`.

**Tech Stack:** Astro, @astrojs/starlight, @astrojs/react, react-live, prism-react-renderer

---

### Task 1: Remove Docusaurus files

**Files:**
- Delete: `packages/docs/babel.config.cjs`
- Delete: `packages/docs/docusaurus.config.ts`
- Delete: `packages/docs/sidebars.ts`
- Delete: `packages/docs/docs/` (entire directory)
- Delete: `packages/docs/src/css/` (entire directory)
- Delete: `packages/docs/src/theme/` (entire directory)
- Delete: `packages/docs/.docusaurus/` (generated cache)

**Step 1: Remove old files**

```bash
cd packages/docs
rm -f babel.config.cjs docusaurus.config.ts sidebars.ts
rm -rf docs/ src/css/ src/theme/ .docusaurus/
```

**Step 2: Verify only package.json, tsconfig.json, biome.json, node_modules remain**

```bash
ls packages/docs/
```

Expected: `biome.json  node_modules  package.json  src  tsconfig.json`
(src/ should be empty or just the directory)

---

### Task 2: Create package.json

**Files:**
- Modify: `packages/docs/package.json`

**Step 1: Write new package.json**

Replace the entire file:

```json
{
	"name": "@bezny/docs",
	"version": "0.1.0",
	"private": true,
	"type": "module",
	"scripts": {
		"start": "astro dev --port 4300",
		"build": "astro build",
		"lint": "biome check .",
		"lint:fix": "biome check --write ."
	},
	"dependencies": {
		"@astrojs/react": "^4.3.0",
		"@astrojs/starlight": "^0.35.0",
		"@bezny/button": "workspace:*",
		"@bezny/styles": "workspace:*",
		"astro": "^5.10.0",
		"react": "catalog:",
		"react-dom": "catalog:",
		"react-live": "^4.2.1"
	},
	"devDependencies": {
		"@types/react": "catalog:",
		"@types/react-dom": "catalog:",
		"typescript": "catalog:"
	}
}
```

**Step 2: Install dependencies**

```bash
pnpm install
```

Expected: resolves successfully, no errors.

---

### Task 3: Create astro.config.ts

**Files:**
- Create: `packages/docs/astro.config.ts`

**Step 1: Write the config**

```ts
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
	integrations: [
		starlight({
			title: "bezny",
			sidebar: [
				{ slug: "intro" },
				{
					label: "Buttons",
					items: [
						{ slug: "buttons/usage" },
						{ slug: "buttons/api" },
					],
				},
			],
			customCss: [
				"@bezny/styles/theme-light.css",
				"@bezny/button/index.css",
			],
		}),
		react(),
	],
});
```

---

### Task 4: Create tsconfig.json

**Files:**
- Modify: `packages/docs/tsconfig.json`

**Step 1: Write Astro-compatible tsconfig**

Replace the entire file. Astro has its own tsconfig presets; we extend the strict one and disable `composite` and `verbatimModuleSyntax` which conflict with Astro:

```json
{
	"extends": "astro/tsconfigs/strict",
	"compilerOptions": {
		"composite": false,
		"verbatimModuleSyntax": false
	}
}
```

---

### Task 5: Update biome.json

**Files:**
- Modify: `packages/docs/biome.json`

**Step 1: Write updated biome config**

Adjust includes for Astro file structure (no more babel/sidebars/docusaurus files):

```json
{
	"$schema": "https://biomejs.dev/schemas/2.4.5/schema.json",
	"root": false,
	"extends": ["@cookielab.io/biome-config/frontend"],
	"files": {
		"includes": ["src/**", "astro.config.ts"]
	},
	"linter": {
		"rules": {
			"style": {
				"useExportsLast": "off"
			}
		}
	},
	"overrides": [
		{
			"includes": ["astro.config.ts"],
			"linter": {
				"rules": {
					"correctness": {
						"noNodejsModules": "off"
					},
					"style": {
						"noDefaultExport": "off"
					}
				}
			}
		},
		{
			"includes": ["src/components/**"],
			"linter": {
				"rules": {
					"style": {
						"noDefaultExport": "off",
						"useNamingConvention": "off"
					}
				}
			}
		}
	]
}
```

---

### Task 6: Create LivePreview component

**Files:**
- Create: `packages/docs/src/components/LivePreview.tsx`

**Step 1: Write the component**

This is a React component that wraps `react-live`. It:
- Accepts a `code` string prop (the user-visible code)
- Pre-injects `Button` and `Submit` into the live scope
- Auto-wraps the preview in `<div data-theme="light">`
- Renders preview on top, editor below

```tsx
import { Button, Submit } from "@bezny/button";
import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";
import type { ReactNode } from "react";

const scope = {
	Button: Button,
	Submit: Submit,
};

function BeznyWrapper({ children }: { children: ReactNode }) {
	return <div data-theme="light">{children}</div>;
}

export default function LiveCodePreview({ code }: { code: string }) {
	return (
		<LiveProvider code={code} scope={scope}>
			<div style={{ border: "1px solid var(--sl-color-gray-5)", borderRadius: "0.5rem", overflow: "hidden" }}>
				<div style={{ padding: "1.5rem", borderBottom: "1px solid var(--sl-color-gray-5)" }}>
					<BeznyWrapper>
						<LivePreview />
					</BeznyWrapper>
				</div>
				<LiveEditor style={{ fontSize: "0.875rem" }} />
			</div>
			<LiveError style={{ color: "#dc2626", backgroundColor: "#fee2e2", padding: "0.75rem", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.875rem", marginTop: "0.5rem" }} />
		</LiveProvider>
	);
}
```

---

### Task 7: Create intro page

**Files:**
- Create: `packages/docs/src/content/docs/intro.md`

**Step 1: Write the page**

```md
---
title: Getting Started
---

bezny is a React component framework built on a shared design system with CSS custom properties.

## Installation

```bash
pnpm add @bezny/button @bezny/styles
\```

## Setup

Import the theme CSS in your application entry point:

```css
@import "@bezny/styles/theme-light.css";
@import "@bezny/button/index.css";
\```

Then wrap your app (or the relevant subtree) with the `data-theme` attribute:

```html
<div data-theme="light">
  <!-- your app -->
</div>
\```

## Usage

```tsx
import { Button } from "@bezny/button";

function App() {
  return <Button variant="primary">Click me</Button>;
}
\```
```

Note: The backslash-escaped closing fences above (`\```) are plan escaping only — write them as normal ``` in the actual file.

---

### Task 8: Create buttons/usage.mdx

**Files:**
- Create: `packages/docs/src/content/docs/buttons/usage.mdx`

**Step 1: Write the page**

Each live example uses `<LivePreview client:load code={...} />`. The `BeznyProvider` wrapper is auto-injected so users only see the component code.

```mdx
---
title: Button Usage
---

import LivePreview from "../../../components/LivePreview";

Interactive examples of the Button and Submit components from `@bezny/button`.

## Basic Usage

<LivePreview client:load code={`<Button>Click me</Button>`} />

## Variants

The Button component supports three variants: `primary`, `secondary`, and `ghost`.

<LivePreview client:load code={`<div style={{ display: "flex", gap: "8px" }}>
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="ghost">Ghost</Button>
</div>`} />

## Disabled State

<LivePreview client:load code={`<div style={{ display: "flex", gap: "8px" }}>
  <Button disabled>Disabled Primary</Button>
  <Button variant="secondary" disabled>Disabled Secondary</Button>
  <Button variant="ghost" disabled>Disabled Ghost</Button>
</div>`} />

## Submit Component

The `Submit` component is a convenience wrapper around `Button` with `type="submit"`.

<LivePreview client:load code={`<form onSubmit={(e) => { e.preventDefault(); alert("Submitted!"); }}>
  <Submit>Submit Form</Submit>
</form>`} />

## Event Handling

<LivePreview client:load code={`<Button onClick={() => alert("Clicked!")}>Click me</Button>`} />
```

---

### Task 9: Create buttons/api.mdx

**Files:**
- Create: `packages/docs/src/content/docs/buttons/api.mdx`

**Step 1: Write the page**

Note: The `className` type is `ClassValue` (from clsx), which covers `string | string[] | Record<string, boolean>` and more.

```mdx
---
title: Button API Reference
---

## Button

```tsx
import { Button } from "@bezny/button";
\```

A styled button component with variant support.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"primary" \| "secondary" \| "ghost"` | `"primary"` | Visual style variant |
| `className` | `ClassValue` | — | Additional CSS classes (clsx-compatible) |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | HTML button type |
| `children` | `ReactNode` | — | Button content |
| `disabled` | `boolean` | `false` | Disables the button |
| `...rest` | `ComponentPropsWithoutRef<"button">` | — | All other native button attributes |

### Examples

```tsx
<Button>Default primary button</Button>

<Button variant="secondary" onClick={handleClick}>
  Secondary
</Button>

<Button variant="ghost" className="my-custom-class">
  Ghost with custom class
</Button>
\```

## Submit

```tsx
import { Submit } from "@bezny/button";
\```

A convenience wrapper around `Button` with `type="submit"`. Accepts all the same props as `Button`.

### Props

Identical to `Button`, except `type` is always `"submit"`.

### Examples

```tsx
<form onSubmit={handleSubmit}>
  <Submit>Send</Submit>
</form>

<form onSubmit={handleSubmit}>
  <Submit variant="secondary">Save Draft</Submit>
</form>
\```
```

Note: The backslash-escaped closing fences above (`\```) are plan escaping only — write them as normal ``` in the actual file.

---

### Task 10: Build dependencies, install, and verify

**Step 1: Install dependencies**

```bash
pnpm install
```

**Step 2: Build @bezny/styles and @bezny/button**

```bash
pnpm --filter=@bezny/styles build && pnpm --filter=@bezny/button build
```

Expected: Both build successfully.

**Step 3: Start dev server**

```bash
pnpm --filter=@bezny/docs start
```

Expected: Astro dev server starts on port 4300, compiles without errors.

**Step 4: Run lint**

```bash
pnpm --filter=@bezny/docs lint
```

Expected: No errors.

**Step 5: Verify in browser**

- `http://localhost:4300/intro/` — Getting started page renders
- `http://localhost:4300/buttons/usage/` — Live previews show styled buttons, editor is editable
- `http://localhost:4300/buttons/api/` — Props tables render correctly

---

### Task 11: Update root dev script

**Files:**
- Verify: `package.json` (root)

**Step 1: Ensure root dev script still works**

The root `package.json` already has `"dev": "pnpm --filter=@bezny/docs start"`. Since we changed the docs start script from `docusaurus start --port 4300` to `astro dev --port 4300`, the root script needs no changes.

```bash
pnpm dev
```

Expected: Astro dev server starts on port 4300.
