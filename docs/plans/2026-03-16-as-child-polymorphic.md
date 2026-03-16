# `asChild` Polymorphic Components Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `createPolymorphic` factory to `@bezny/styles` and migrate all components to support the `asChild` prop for rendering as different HTML elements or React components.

**Architecture:** A generic `createPolymorphic<DefaultTag, OwnProps>()` factory function that returns a component accepting `asChild`. The factory splits own props from pass-through props and delegates rendering to a user-provided render function. Lives in `@bezny/styles` alongside the existing SCSS utilities.

**Tech Stack:** React 19, TypeScript 5.7, Vite, Vitest, @testing-library/react

---

### Task 1: Add TypeScript and React build support to `@bezny/styles`

The styles package currently only builds SCSS. We need to add TypeScript/JSX compilation so it can export `createPolymorphic`.

**Files:**
- Modify: `packages/styles/package.json`
- Modify: `packages/styles/vite.config.ts`
- Create: `packages/styles/tsconfig.json`
- Create: `packages/styles/src/index.ts`

**Step 1: Add tsconfig.json**

Create `packages/styles/tsconfig.json`:

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

**Step 2: Create empty index.ts**

Create `packages/styles/src/index.ts`:

```ts
// Polymorphic component utilities will be exported here
```

**Step 3: Update vite.config.ts to build both SCSS and TS**

Replace `packages/styles/vite.config.ts` with:

```ts
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [react(), dts({ include: ["src"] })],
  build: {
    cssCodeSplit: true,
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        theme: resolve(import.meta.dirname, "src/bezny.scss"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        assetFileNames: "[name][extname]",
      },
    },
  },
});
```

**Step 4: Update package.json**

Update `packages/styles/package.json`:

```json
{
  "name": "@bezny/styles",
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./theme.css": "./dist/theme.css",
    "./styles/*": "./src/_*.scss",
    "./theme": "./src/_theme.scss",
    "./palettes": "./src/_palettes.scss"
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
  "devDependencies": {
    "@types/react": "catalog:",
    "@vitejs/plugin-react": "catalog:",
    "react": "catalog:",
    "sass": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:",
    "vite-plugin-dts": "catalog:",
    "@testing-library/react": "catalog:",
    "@testing-library/jest-dom": "catalog:",
    "vitest": "catalog:",
    "jsdom": "catalog:"
  }
}
```

**Step 5: Run build to verify setup**

Run: `cd packages/styles && pnpm install && pnpm build`
Expected: Build succeeds, produces `dist/index.js`, `dist/index.d.ts`, and `dist/theme.css`

**Step 6: Commit**

```bash
git add packages/styles/
git commit -m "feat(styles): add TypeScript build support for polymorphic utilities"
```

---

### Task 2: Implement `createPolymorphic` with tests

**Files:**
- Create: `packages/styles/src/createPolymorphic.tsx`
- Modify: `packages/styles/src/index.ts`
- Create: `packages/styles/vitest.config.ts`
- Create: `packages/styles/src/test/setup.ts`
- Create: `packages/styles/src/createPolymorphic.test.tsx`

**Step 1: Add vitest config and test setup**

Create `packages/styles/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
  },
});
```

Create `packages/styles/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

**Step 2: Write the failing tests**

Create `packages/styles/src/createPolymorphic.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createPolymorphic } from "./createPolymorphic";

describe("createPolymorphic", () => {
  it("renders the default HTML tag", () => {
    const Box = createPolymorphic("div", (Tag, _ownProps, rest) => (
      <Tag data-testid="box" {...rest} />
    ));

    render(<Box>hello</Box>);
    const el = screen.getByTestId("box");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveTextContent("hello");
  });

  it("renders a different HTML tag via asChild", () => {
    const Box = createPolymorphic("div", (Tag, _ownProps, rest) => (
      <Tag data-testid="box" {...rest} />
    ));

    render(<Box asChild="section">hello</Box>);
    const el = screen.getByTestId("box");
    expect(el.tagName).toBe("SECTION");
  });

  it("passes own props to the render function", () => {
    type OwnProps = { variant: "a" | "b" };

    const Box = createPolymorphic<"div", OwnProps>(
      "div",
      (Tag, { variant }, rest) => (
        <Tag data-testid="box" data-variant={variant} {...rest} />
      ),
    );

    render(<Box variant="a">hello</Box>);
    expect(screen.getByTestId("box")).toHaveAttribute("data-variant", "a");
  });

  it("passes HTML attributes through rest for the default tag", () => {
    const Box = createPolymorphic("a", (_Tag, _ownProps, rest) => (
      <a data-testid="box" {...rest} />
    ));

    render(<Box href="/test">link</Box>);
    expect(screen.getByTestId("box")).toHaveAttribute("href", "/test");
  });

  it("renders a React component via asChild", () => {
    function CustomLink(props: { to: string; children?: React.ReactNode }) {
      return (
        <a data-testid="custom" href={props.to}>
          {props.children}
        </a>
      );
    }

    const Box = createPolymorphic("div", (Tag, _ownProps, rest) => (
      <Tag {...rest} />
    ));

    render(
      <Box asChild={CustomLink} to="/custom">
        hello
      </Box>,
    );
    const el = screen.getByTestId("custom");
    expect(el).toHaveAttribute("href", "/custom");
    expect(el).toHaveTextContent("hello");
  });

  it("does not pass asChild to the rendered element", () => {
    const Box = createPolymorphic("div", (Tag, _ownProps, rest) => (
      <Tag data-testid="box" {...rest} />
    ));

    render(<Box>hello</Box>);
    expect(screen.getByTestId("box")).not.toHaveAttribute("asChild");
    expect(screen.getByTestId("box")).not.toHaveAttribute("aschild");
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `cd packages/styles && pnpm test`
Expected: FAIL — `createPolymorphic` module not found

**Step 4: Implement createPolymorphic**

Create `packages/styles/src/createPolymorphic.tsx`:

```tsx
import type { ComponentPropsWithoutRef, ComponentType, ElementType, ReactNode } from "react";

type AsChild = keyof JSX.IntrinsicElements | ComponentType<any>;

type ResolveTagProps<T extends AsChild> =
  T extends keyof JSX.IntrinsicElements
    ? ComponentPropsWithoutRef<T>
    : T extends ComponentType<infer P>
      ? P
      : never;

export type PolymorphicProps<
  DefaultTag extends ElementType,
  OwnProps,
  T extends AsChild = DefaultTag & AsChild,
> = OwnProps &
  { asChild?: T } &
  Omit<ResolveTagProps<T>, keyof OwnProps | "asChild">;

type RenderFn<OwnProps> = (
  Tag: AsChild,
  ownProps: OwnProps,
  rest: Record<string, unknown>,
) => ReactNode;

export function createPolymorphic<
  DefaultTag extends keyof JSX.IntrinsicElements,
  OwnProps extends Record<string, unknown> = Record<string, never>,
>(defaultTag: DefaultTag, render: RenderFn<OwnProps>) {
  function PolymorphicComponent<T extends AsChild = DefaultTag & AsChild>({
    asChild,
    ...allProps
  }: PolymorphicProps<DefaultTag, OwnProps, T>) {
    const Tag = (asChild ?? defaultTag) as AsChild;
    return render(Tag, allProps as unknown as OwnProps, allProps as unknown as Record<string, unknown>);
  }

  PolymorphicComponent.displayName = `Polymorphic(${defaultTag})`;
  return PolymorphicComponent;
}
```

> **Note to implementer:** The `OwnProps` / rest split is intentionally simple — both are the full `allProps` bag. The render function destructures what it needs from `ownProps` and passes the rest via `...rest`. This avoids runtime key-tracking overhead. The render function is responsible for destructuring own props out before spreading rest.

**Step 5: Export from index.ts**

Replace `packages/styles/src/index.ts`:

```ts
export { createPolymorphic } from "./createPolymorphic";
export type { PolymorphicProps } from "./createPolymorphic";
```

**Step 6: Run tests to verify they pass**

Run: `cd packages/styles && pnpm test`
Expected: All 6 tests PASS

**Step 7: Run build to verify types are emitted**

Run: `cd packages/styles && pnpm build`
Expected: `dist/index.js` and `dist/index.d.ts` contain the exported function and types

**Step 8: Commit**

```bash
git add packages/styles/
git commit -m "feat(styles): implement createPolymorphic factory"
```

---

### Task 3: Migrate Button as the pilot component

**Files:**
- Modify: `packages/button/src/Button.tsx`
- Modify: `packages/button/package.json` (add `@bezny/styles` dependency)

**Step 1: Add @bezny/styles dependency**

Add to `packages/button/package.json` dependencies:

```json
"dependencies": {
  "clsx": "catalog:",
  "@bezny/styles": "workspace:*"
}
```

Run: `pnpm install`

**Step 2: Migrate Button to createPolymorphic**

Replace `packages/button/src/Button.tsx`:

```tsx
import { createPolymorphic } from "@bezny/styles";
import clsx, { type ClassValue } from "clsx";
import styles from "./Button.module.scss";

type ButtonVariant = "default" | "primary" | "secondary" | "ghost" | "link";

export type ButtonOwnProps = {
  className?: ClassValue;
  variant?: ButtonVariant;
};

const variantClassMap: Record<ButtonVariant, string> = {
  default: styles.default,
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  link: styles.link,
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

**Step 3: Verify build**

Run: `cd packages/button && pnpm build`
Expected: Build succeeds

**Step 4: Verify types work (manual check)**

Open the project in an editor and verify:
- `<Button variant="primary">` — works, renders `<button>`
- `<Button asChild="a" href="/home">` — works, `href` is typed
- `<Button asChild="a" href={123}>` — type error (href must be string)

**Step 5: Commit**

```bash
git add packages/button/
git commit -m "feat(button): migrate Button to createPolymorphic"
```

---

### Task 4: Migrate remaining component packages

Each package follows the same pattern as Task 3. For each package:

1. Add `"@bezny/styles": "workspace:*"` to dependencies (if not already there)
2. Run `pnpm install`
3. Rewrite each component using `createPolymorphic`
4. Build and verify

**Important notes per component:**

#### `packages/alert/src/Alert.tsx`
- Default tag: `"div"`
- OwnProps: `{ className, variant }` (variant is required)
- The render function must set `role` based on variant

#### `packages/card/src/Card.tsx`
- Migrate: Card, CardHeader, CardBody, CardFooter
- Skip: CardImg (composite element, not a candidate)
- Default tags: all `"div"`
- After migration, re-attach compound component properties: `Card.Body = CardBody;` etc.

#### `packages/text/src/Heading.tsx`
- Special case: default tag is dynamic (`h1`–`h6` based on level)
- Do NOT use createPolymorphic for Heading — it already has its own polymorphism via level prop
- Skip this component

#### `packages/text/src/Paragraph.tsx`
- Default tag: `"p"`
- OwnProps: `{ className }`

#### `packages/text/src/Label.tsx`
- Default tag: `"label"`
- OwnProps: `{ className }`

#### `packages/navigation/src/Link.tsx`
- Default tag: `"a"`
- OwnProps: `{ className, href, target }`
- Render function must compute `rel` for `target="_blank"`

#### `packages/navigation/src/NavLink.tsx`
- Has existing `renderLink` prop — assess if `asChild` replaces it or coexists
- If `renderLink` is only used for router integration, `asChild` replaces it

#### `packages/navigation/src/Navbar.tsx`, `NavbarBrand.tsx`
- Default tag: `"nav"` (Navbar), `"a"` (NavbarBrand)

#### `packages/navigation/src/Breadcrumbs.tsx`, `Sidebar.tsx`
- Default tag: `"nav"` (both)

#### `packages/layout/src/Stack.tsx`
- Default tag: `"div"`
- OwnProps: `{ className, direction, gap }`
- Render function must compute `style` for gap

#### `packages/layout/src/Container.tsx`, `Aside.tsx`, `Main.tsx`, `Article.tsx`, `Section.tsx`
- Each has a fixed semantic HTML tag — these are prime candidates
- Default tags: `"div"`, `"aside"`, `"main"`, `"article"`, `"section"`

#### `packages/forms/*`
- Forms components (Input, Select, etc.) may have more complex internal structure
- Only migrate if the component renders a single root element
- Read each component before migrating

#### `packages/dialog/src/Dialog.tsx`
- Has DialogHeader, DialogBody, DialogFooter subcomponents
- Migrate subcomponents that render simple wrappers

#### `packages/drawer/src/Drawer.tsx`, `packages/dropdown/src/Dropdown.tsx`
- Likely use portals and focus management — read before migrating
- Only add `asChild` if it makes sense for the root container element

#### `packages/avatar/src/Avatar.tsx`
- Default tag: probably `"div"` or `"span"`

#### `packages/overlay/src/Overlay.tsx`
- Default tag: `"div"`

**Step (for each package):** Build and verify

Run: `pnpm build` (from root, builds all packages)
Expected: All packages build successfully

**Step: Final commit**

```bash
git add packages/
git commit -m "feat: migrate all components to createPolymorphic"
```

---

### Task 5: Update documentation

**Files:**
- Modify: `packages/docs/src/content/docs/buttons/usage.mdx` (add asChild examples)
- Consider: adding a dedicated "Polymorphism" docs page

**Step 1: Add asChild usage examples to Button docs**

Add a section showing:
- `<Button asChild="a" href="/home">` for link buttons
- `<Button asChild={RouterLink}>` for framework router integration
- `<Card asChild="article">` for semantic HTML

**Step 2: Commit**

```bash
git add packages/docs/
git commit -m "docs: add asChild polymorphic component examples"
```
