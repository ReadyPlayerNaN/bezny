# New Component Packages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 5 new component packages (@bezny/tabs, @bezny/badge, @bezny/tooltip, @bezny/pagination, @bezny/popover) and integrate them into the docs site.

**Architecture:** Each package follows the established monorepo pattern: Vite build with dts plugin, SCSS modules using core mixins, vitest-axe a11y tests, ESM-only exports. Tabs uses context-based compound components (like Navbar). Tooltip and Popover use portal-based positioning (like Dropdown). Badge and Pagination are simpler presentational components.

**Tech Stack:** React 19, TypeScript strict, SCSS modules, CSS custom properties, Vite, Vitest + vitest-axe, Biome linting.

---

## Scaffolding Pattern (applies to all 5 packages)

Every new package needs these files matching existing patterns exactly:

**package.json** — Copy from `packages/dropdown/package.json`, change `name` to `@bezny/<name>`, set `version` to `0.1.0`. Add `@bezny/core` to `dependencies` if the package uses `createPolymorphic`. Keep `clsx` in dependencies. Keep all devDependencies identical.

**vite.config.ts** — Identical to `packages/dropdown/vite.config.ts`. Add `@bezny/core` to `rollupOptions.external` if it's a dependency.

**tsconfig.json** — Identical to `packages/dropdown/tsconfig.json`.

**src/test/setup.ts** — Identical to `packages/dropdown/src/test/setup.ts`.

**src/index.ts** — Re-exports from component files.

---

## Task 1: @bezny/badge

Simple presentational component. No context needed.

**Files:**
- Create: `packages/badge/package.json`
- Create: `packages/badge/vite.config.ts`
- Create: `packages/badge/tsconfig.json`
- Create: `packages/badge/src/test/setup.ts`
- Create: `packages/badge/src/Badge.tsx`
- Create: `packages/badge/src/Badge.module.scss`
- Create: `packages/badge/src/Badge.a11y.test.tsx`
- Create: `packages/badge/src/index.ts`

### Step 1: Scaffold package

Create all config files per the scaffolding pattern above. `package.json` name: `@bezny/badge`. Dependencies: `clsx`. No `@bezny/core` needed (no polymorphic).

### Step 2: Write a11y test

```tsx
// src/Badge.a11y.test.tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Badge } from "./Badge";

describe("Badge a11y", () => {
	it("has no accessibility violations", async () => {
		render(<Badge>Active</Badge>);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});

	it("has no accessibility violations with variant", async () => {
		render(<Badge variant="success">Published</Badge>);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
```

### Step 3: Run test to verify it fails

Run: `cd packages/badge && pnpm test`
Expected: FAIL — Badge not found

### Step 4: Implement Badge component

```tsx
// src/Badge.tsx
import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./Badge.module.scss";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

export type BadgeProps = {
	children?: ReactNode;
	className?: ClassValue;
	variant?: BadgeVariant;
};

const variantClassMap: Record<BadgeVariant, string> = {
	default: styles.default,
	success: styles.success,
	warning: styles.warning,
	danger: styles.danger,
	info: styles.info,
};

export function Badge({ children, className, variant = "default" }: BadgeProps) {
	return (
		<span className={clsx(styles.badge, variantClassMap[variant], className)}>
			{children}
		</span>
	);
}
```

```scss
// src/Badge.module.scss
@use 'grid' as *;

.badge {
	display: inline-flex;
	align-items: center;
	border-radius: var(--bzn-badge-radius, 9999px);
	font-size: var(--bzn-badge-font-size, 12px);
	font-weight: var(--bzn-badge-font-weight, 600);
	line-height: 1;
	padding: size(1) size(2);
	white-space: nowrap;
}

.default {
	background-color: var(--bzn-badge-default-bg, var(--bzn-surface-muted));
	color: var(--bzn-badge-default-color, var(--bzn-text-muted));
}

.success {
	background-color: var(--bzn-badge-success-bg, var(--bzn-success-surface));
	color: var(--bzn-badge-success-color, var(--bzn-success-text));
}

.warning {
	background-color: var(--bzn-badge-warning-bg, var(--bzn-warning-surface));
	color: var(--bzn-badge-warning-color, var(--bzn-warning-text));
}

.danger {
	background-color: var(--bzn-badge-danger-bg, var(--bzn-danger-surface));
	color: var(--bzn-badge-danger-color, var(--bzn-danger-text));
}

.info {
	background-color: var(--bzn-badge-info-bg, var(--bzn-info-surface));
	color: var(--bzn-badge-info-color, var(--bzn-info-text));
}
```

```ts
// src/index.ts
export * from "./Badge";
```

### Step 5: Run test to verify it passes

Run: `cd packages/badge && pnpm test`
Expected: PASS

### Step 6: Run lint

Run: `cd packages/badge && pnpm lint`
Expected: PASS (fix any issues)

### Step 7: Commit

```
feat(badge): add @bezny/badge package
```

---

## Task 2: @bezny/tabs

Context-based compound component: `Tabs`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel`.

**Files:**
- Create: `packages/tabs/package.json`
- Create: `packages/tabs/vite.config.ts`
- Create: `packages/tabs/tsconfig.json`
- Create: `packages/tabs/src/test/setup.ts`
- Create: `packages/tabs/src/TabsContext.ts`
- Create: `packages/tabs/src/Tabs.tsx`
- Create: `packages/tabs/src/TabList.tsx`
- Create: `packages/tabs/src/Tab.tsx`
- Create: `packages/tabs/src/TabPanel.tsx`
- Create: `packages/tabs/src/Tabs.module.scss`
- Create: `packages/tabs/src/Tabs.a11y.test.tsx`
- Create: `packages/tabs/src/index.ts`

### Step 1: Scaffold package

`package.json` name: `@bezny/tabs`. Dependencies: `clsx`. No `@bezny/core`.

### Step 2: Write a11y test

```tsx
// src/Tabs.a11y.test.tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Tabs } from "./Tabs";
import { Tab } from "./Tab";
import { TabList } from "./TabList";
import { TabPanel } from "./TabPanel";

function TestTabs() {
	return (
		<Tabs defaultValue="one">
			<TabList aria-label="Sample tabs">
				<Tab value="one">Tab One</Tab>
				<Tab value="two">Tab Two</Tab>
			</TabList>
			<TabPanel value="one">Content one</TabPanel>
			<TabPanel value="two">Content two</TabPanel>
		</Tabs>
	);
}

describe("Tabs a11y", () => {
	it("has no accessibility violations", async () => {
		render(<TestTabs />);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
```

### Step 3: Run test to verify it fails

Run: `cd packages/tabs && pnpm test`
Expected: FAIL

### Step 4: Implement TabsContext

```ts
// src/TabsContext.ts
import { createContext, useContext } from "react";

type TabsContextValue = {
	activeValue: string;
	baseId: string;
	onSelect: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
	const context = useContext(TabsContext);
	if (context === null) {
		throw new Error("useTabs must be used within a Tabs component");
	}
	return context;
}

export { TabsContext, type TabsContextValue, useTabs };
```

### Step 5: Implement Tabs (root)

```tsx
// src/Tabs.tsx
import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import styles from "./Tabs.module.scss";
import { TabsContext } from "./TabsContext";

export type TabsOwnProps = {
	children?: ReactNode;
	className?: ClassValue;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	value?: string;
};

export function Tabs({ children, className, defaultValue = "", onValueChange, value: controlledValue }: TabsOwnProps) {
	const [internalValue, setInternalValue] = useState(defaultValue);
	const baseId = useId();
	const isControlled = controlledValue !== undefined;
	const activeValue = isControlled ? controlledValue : internalValue;
	const handleSelect = (val: string) => {
		if (!isControlled) {
			setInternalValue(val);
		}
		onValueChange?.(val);
	};

	return (
		<TabsContext value={{ activeValue, baseId, onSelect: handleSelect }}>
			<div className={clsx(styles.tabs, className)}>{children}</div>
		</TabsContext>
	);
}
```

### Step 6: Implement TabList

```tsx
// src/TabList.tsx
import clsx, { type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./Tabs.module.scss";

export type TabListProps = Omit<ComponentPropsWithoutRef<"div">, "role" | "className"> & {
	className?: ClassValue;
};

export function TabList({ className, ...rest }: TabListProps) {
	return <div role="tablist" className={clsx(styles.tabList, className)} {...rest} />;
}
```

### Step 7: Implement Tab

```tsx
// src/Tab.tsx
import clsx, { type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./Tabs.module.scss";
import { useTabs } from "./TabsContext";

export type TabProps = Omit<ComponentPropsWithoutRef<"button">, "role" | "className" | "id"> & {
	className?: ClassValue;
	value: string;
};

export function Tab({ className, value, ...rest }: TabProps) {
	const { activeValue, baseId, onSelect } = useTabs();
	const isActive = activeValue === value;

	return (
		<button
			role="tab"
			type="button"
			id={`${baseId}-tab-${value}`}
			aria-selected={isActive}
			aria-controls={`${baseId}-panel-${value}`}
			tabIndex={isActive ? 0 : -1}
			className={clsx(styles.tab, isActive && styles.tabActive, className)}
			onClick={() => onSelect(value)}
			{...rest}
		/>
	);
}
```

### Step 8: Implement TabPanel

```tsx
// src/TabPanel.tsx
import clsx, { type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./Tabs.module.scss";
import { useTabs } from "./TabsContext";

export type TabPanelProps = Omit<ComponentPropsWithoutRef<"div">, "role" | "className" | "id"> & {
	className?: ClassValue;
	value: string;
};

export function TabPanel({ className, value, ...rest }: TabPanelProps) {
	const { activeValue, baseId } = useTabs();
	const isActive = activeValue === value;

	if (!isActive) {
		return null;
	}

	return (
		<div
			role="tabpanel"
			id={`${baseId}-panel-${value}`}
			aria-labelledby={`${baseId}-tab-${value}`}
			className={clsx(styles.tabPanel, className)}
			{...rest}
		/>
	);
}
```

### Step 9: Implement styles

```scss
// src/Tabs.module.scss
@use 'grid' as *;

.tabs {
	display: flex;
	flex-direction: column;
}

.tabList {
	display: flex;
	border-bottom: 1px solid var(--bzn-tabs-border, var(--bzn-border));
	gap: size(1);
}

.tab {
	appearance: none;
	background: transparent;
	border: none;
	border-bottom: 2px solid transparent;
	color: var(--bzn-tabs-tab-color, var(--bzn-text-muted));
	cursor: pointer;
	font: inherit;
	padding: size(2) size(3);
	transition:
		color var(--bzn-transition) var(--bzn-transition-fn),
		border-color var(--bzn-transition) var(--bzn-transition-fn);

	&:hover {
		color: var(--bzn-tabs-tab-hover-color, var(--bzn-text));
	}

	&:focus-visible {
		outline: 2px solid var(--bzn-focus-ring);
		outline-offset: -2px;
	}
}

.tabActive {
	border-bottom-color: var(--bzn-tabs-active-border, var(--bzn-interactive-bg));
	color: var(--bzn-tabs-active-color, var(--bzn-text));
}

.tabPanel {
	padding: size(3) 0;
}
```

### Step 10: Write index.ts with compound export

```ts
// src/index.ts
import { Tab } from "./Tab";
import { TabList } from "./TabList";
import { TabPanel } from "./TabPanel";
import { Tabs as TabsBase } from "./Tabs";

export { Tab, type TabProps } from "./Tab";
export { TabList, type TabListProps } from "./TabList";
export { TabPanel, type TabPanelProps } from "./TabPanel";
export { type TabsOwnProps } from "./Tabs";
export { type TabsContextValue, useTabs } from "./TabsContext";

// biome-ignore lint/style/useNamingConvention: React compound component convention
export const Tabs = Object.assign(TabsBase, {
	// biome-ignore lint/style/useNamingConvention: React compound component convention
	List: TabList,
	// biome-ignore lint/style/useNamingConvention: React compound component convention
	Tab: Tab,
	// biome-ignore lint/style/useNamingConvention: React compound component convention
	Panel: TabPanel,
});
```

### Step 11: Run tests and lint

Run: `cd packages/tabs && pnpm test && pnpm lint`
Expected: PASS

### Step 12: Commit

```
feat(tabs): add @bezny/tabs compound component package
```

---

## Task 3: @bezny/tooltip

Portal-based positioned tooltip on hover/focus. Similar positioning to Dropdown but simpler (no click-outside, no menu role).

**Files:**
- Create: `packages/tooltip/package.json`
- Create: `packages/tooltip/vite.config.ts`
- Create: `packages/tooltip/tsconfig.json`
- Create: `packages/tooltip/src/test/setup.ts`
- Create: `packages/tooltip/src/Tooltip.tsx`
- Create: `packages/tooltip/src/Tooltip.module.scss`
- Create: `packages/tooltip/src/Tooltip.a11y.test.tsx`
- Create: `packages/tooltip/src/index.ts`

### Step 1: Scaffold package

`package.json` name: `@bezny/tooltip`. Dependencies: `clsx`.

### Step 2: Write a11y test

```tsx
// src/Tooltip.a11y.test.tsx
import { render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Tooltip } from "./Tooltip";

function TestTooltip() {
	const anchorRef = useRef<HTMLButtonElement>(null);
	return (
		<>
			<button ref={anchorRef} type="button" aria-describedby="test-tooltip">
				Hover me
			</button>
			<Tooltip id="test-tooltip" open={true} anchorRef={anchorRef}>
				Tooltip content
			</Tooltip>
		</>
	);
}

describe("Tooltip a11y", () => {
	it("has no accessibility violations", async () => {
		render(<TestTooltip />);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
```

### Step 3: Run test to verify it fails

Run: `cd packages/tooltip && pnpm test`
Expected: FAIL

### Step 4: Implement Tooltip

```tsx
// src/Tooltip.tsx
import clsx, { type ClassValue } from "clsx";
import { type ReactNode, type RefObject, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Tooltip.module.scss";

export type TooltipPlacement = "top" | "bottom";

export type TooltipProps = {
	anchorRef: RefObject<HTMLElement | null>;
	children?: ReactNode;
	className?: ClassValue;
	id?: string;
	open: boolean;
	placement?: TooltipPlacement;
};

export function Tooltip({ anchorRef, children, className, id, open, placement = "top" }: TooltipProps) {
	const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

	const updatePosition = useCallback(() => {
		const anchor = anchorRef.current;
		if (!anchor) {
			return;
		}
		const rect = anchor.getBoundingClientRect();
		const left = rect.left + rect.width / 2 + window.scrollX;
		const top =
			placement === "top"
				? rect.top + window.scrollY
				: rect.bottom + window.scrollY;
		setPosition({ left, top });
	}, [anchorRef, placement]);

	useLayoutEffect(() => {
		if (!open) {
			return;
		}
		updatePosition();
	}, [open, updatePosition]);

	useEffect(() => {
		if (!open) {
			return;
		}
		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);
		return () => {
			window.removeEventListener("scroll", updatePosition, true);
			window.removeEventListener("resize", updatePosition);
		};
	}, [open, updatePosition]);

	if (!open) {
		return null;
	}

	return createPortal(
		<div
			className={clsx(styles.tooltip, styles[placement], className)}
			id={id}
			role="tooltip"
			style={{ left: position.left, top: position.top }}
		>
			{children}
		</div>,
		document.body,
	);
}
```

```scss
// src/Tooltip.module.scss
@use 'grid' as *;

.tooltip {
	background-color: var(--bzn-tooltip-bg, var(--bzn-surface-inverse));
	border-radius: var(--bzn-tooltip-radius, 6px);
	color: var(--bzn-tooltip-color, var(--bzn-text-inverse));
	font-size: var(--bzn-tooltip-font-size, 12px);
	line-height: 1.4;
	max-width: 240px;
	padding: size(1) size(2);
	pointer-events: none;
	position: absolute;
	transform: translateX(-50%);
	white-space: normal;
	z-index: 300;
}

.top {
	transform: translate(-50%, -100%);
	margin-top: size(-1);
}

.bottom {
	margin-top: size(1);
	transform: translateX(-50%);
}
```

```ts
// src/index.ts
export * from "./Tooltip";
```

### Step 5: Run tests and lint

Run: `cd packages/tooltip && pnpm test && pnpm lint`
Expected: PASS

### Step 6: Commit

```
feat(tooltip): add @bezny/tooltip package
```

---

## Task 4: @bezny/pagination

Presentational pagination controls with page buttons, prev/next.

**Files:**
- Create: `packages/pagination/package.json`
- Create: `packages/pagination/vite.config.ts`
- Create: `packages/pagination/tsconfig.json`
- Create: `packages/pagination/src/test/setup.ts`
- Create: `packages/pagination/src/Pagination.tsx`
- Create: `packages/pagination/src/Pagination.module.scss`
- Create: `packages/pagination/src/Pagination.a11y.test.tsx`
- Create: `packages/pagination/src/index.ts`

### Step 1: Scaffold package

`package.json` name: `@bezny/pagination`. Dependencies: `clsx`.

### Step 2: Write a11y test

```tsx
// src/Pagination.a11y.test.tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Pagination } from "./Pagination";

describe("Pagination a11y", () => {
	it("has no accessibility violations", async () => {
		render(<Pagination page={3} totalPages={10} onPageChange={() => undefined} />);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});

	it("has no accessibility violations on first page", async () => {
		render(<Pagination page={1} totalPages={5} onPageChange={() => undefined} />);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
```

### Step 3: Run test to verify it fails

Run: `cd packages/pagination && pnpm test`
Expected: FAIL

### Step 4: Implement Pagination

```tsx
// src/Pagination.tsx
import clsx, { type ClassValue } from "clsx";
import styles from "./Pagination.module.scss";

export type PaginationProps = {
	className?: ClassValue;
	onPageChange: (page: number) => void;
	page: number;
	siblings?: number;
	totalPages: number;
};

function getPageNumbers(page: number, totalPages: number, siblings: number): (number | "ellipsis")[] {
	const range: (number | "ellipsis")[] = [];
	const left = Math.max(2, page - siblings);
	const right = Math.min(totalPages - 1, page + siblings);

	range.push(1);
	if (left > 2) {
		range.push("ellipsis");
	}
	for (let i = left; i <= right; i++) {
		range.push(i);
	}
	if (right < totalPages - 1) {
		range.push("ellipsis");
	}
	if (totalPages > 1) {
		range.push(totalPages);
	}
	return range;
}

export function Pagination({ className, onPageChange, page, siblings = 1, totalPages }: PaginationProps) {
	const pages = getPageNumbers(page, totalPages, siblings);

	return (
		<nav aria-label="Pagination" className={clsx(styles.pagination, className)}>
			<button
				type="button"
				className={styles.pageButton}
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				aria-label="Previous page"
			>
				&lsaquo;
			</button>
			{pages.map((p, i) =>
				p === "ellipsis" ? (
					<span key={`ellipsis-${i}`} className={styles.ellipsis} aria-hidden="true">
						&hellip;
					</span>
				) : (
					<button
						key={p}
						type="button"
						className={clsx(styles.pageButton, p === page && styles.active)}
						aria-current={p === page ? "page" : undefined}
						onClick={() => onPageChange(p)}
					>
						{p}
					</button>
				),
			)}
			<button
				type="button"
				className={styles.pageButton}
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
				aria-label="Next page"
			>
				&rsaquo;
			</button>
		</nav>
	);
}
```

```scss
// src/Pagination.module.scss
@use 'grid' as *;
@use 'reactions' as *;

.pagination {
	display: flex;
	align-items: center;
	gap: size(1);
}

.pageButton {
	@include interactive;
	appearance: none;
	border: 1px solid var(--bzn-pagination-border, var(--bzn-border));
	border-radius: var(--bzn-pagination-radius, 6px);
	cursor: pointer;
	font: inherit;
	font-size: 14px;
	line-height: 1;
	min-width: size(8);
	padding: size(1.5) size(2);
	text-align: center;
}

.active {
	background-color: var(--bzn-pagination-active-bg, var(--bzn-interactive-bg));
	border-color: var(--bzn-pagination-active-border, var(--bzn-interactive-bg));
	color: var(--bzn-pagination-active-color, var(--bzn-interactive-color));

	&:hover {
		background-color: var(--bzn-pagination-active-bg, var(--bzn-interactive-bg));
		border-color: var(--bzn-pagination-active-border, var(--bzn-interactive-bg));
		color: var(--bzn-pagination-active-color, var(--bzn-interactive-color));
	}
}

.ellipsis {
	padding: size(1.5) size(0.5);
	color: var(--bzn-text-muted);
	user-select: none;
}
```

```ts
// src/index.ts
export * from "./Pagination";
```

### Step 5: Run tests and lint

Run: `cd packages/pagination && pnpm test && pnpm lint`
Expected: PASS

### Step 6: Commit

```
feat(pagination): add @bezny/pagination package
```

---

## Task 5: @bezny/popover

Portal-based positioned content panel, triggered by click. Like Dropdown but without `role="menu"` — uses generic positioned panel semantics.

**Files:**
- Create: `packages/popover/package.json`
- Create: `packages/popover/vite.config.ts`
- Create: `packages/popover/tsconfig.json`
- Create: `packages/popover/src/test/setup.ts`
- Create: `packages/popover/src/Popover.tsx`
- Create: `packages/popover/src/Popover.module.scss`
- Create: `packages/popover/src/Popover.a11y.test.tsx`
- Create: `packages/popover/src/index.ts`

### Step 1: Scaffold package

`package.json` name: `@bezny/popover`. Dependencies: `clsx`.

### Step 2: Write a11y test

```tsx
// src/Popover.a11y.test.tsx
import { render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Popover } from "./Popover";

function TestPopover() {
	const anchorRef = useRef<HTMLButtonElement>(null);
	return (
		<>
			<button ref={anchorRef} type="button">
				Open popover
			</button>
			<Popover open={true} onClose={() => undefined} anchorRef={anchorRef}>
				<p>Popover content</p>
			</Popover>
		</>
	);
}

describe("Popover a11y", () => {
	it("has no accessibility violations", async () => {
		render(<TestPopover />);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
```

### Step 3: Run test to verify it fails

Run: `cd packages/popover && pnpm test`
Expected: FAIL

### Step 4: Implement Popover

```tsx
// src/Popover.tsx
import clsx, { type ClassValue } from "clsx";
import { type ReactNode, type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Popover.module.scss";

export type PopoverProps = {
	align?: "left" | "right";
	anchorRef: RefObject<HTMLElement | null>;
	children?: ReactNode;
	className?: ClassValue;
	onClose: () => void;
	open: boolean;
};

export function Popover({ align = "left", anchorRef, children, className, onClose, open }: PopoverProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

	const updatePosition = useCallback(() => {
		const anchor = anchorRef.current;
		if (!anchor) {
			return;
		}
		const rect = anchor.getBoundingClientRect();
		const panel = panelRef.current;
		const panelWidth = panel ? panel.offsetWidth : 0;
		const left = align === "left" ? rect.left : rect.right - panelWidth;
		setPosition({
			left: left + window.scrollX,
			top: rect.bottom + window.scrollY,
		});
	}, [anchorRef, align]);

	useLayoutEffect(() => {
		if (!open) {
			return;
		}
		updatePosition();
	}, [open, updatePosition]);

	useEffect(() => {
		if (!open) {
			return;
		}
		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);
		return () => {
			window.removeEventListener("scroll", updatePosition, true);
			window.removeEventListener("resize", updatePosition);
		};
	}, [open, updatePosition]);

	useEffect(() => {
		if (!open) {
			return;
		}
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open, onClose]);

	useEffect(() => {
		if (!open) {
			return;
		}
		const handleClick = (event: MouseEvent) => {
			const { target } = event;
			if (!(target instanceof Node)) {
				return;
			}
			if (anchorRef.current?.contains(target)) {
				return;
			}
			if (panelRef.current?.contains(target)) {
				return;
			}
			onClose();
		};
		document.addEventListener("mousedown", handleClick);
		return () => {
			document.removeEventListener("mousedown", handleClick);
		};
	}, [open, onClose, anchorRef]);

	if (!open) {
		return null;
	}

	return createPortal(
		<div
			ref={panelRef}
			className={clsx(styles.popover, className)}
			style={{ left: position.left, top: position.top }}
		>
			{children}
		</div>,
		document.body,
	);
}
```

```scss
// src/Popover.module.scss
@use 'grid' as *;

.popover {
	background-color: var(--bzn-popover-bg, var(--bzn-surface-overlay));
	border: 1px solid var(--bzn-popover-border, var(--bzn-border));
	border-radius: var(--bzn-popover-radius, 8px);
	box-shadow: 0 size(2) size(4) var(--bzn-popover-shadow, rgba(0, 0, 0, calc(var(--bzn-overlay-opacity) * 0.67)));
	padding: size(3);
	position: absolute;
	z-index: 200;
}
```

```ts
// src/index.ts
export * from "./Popover";
```

### Step 5: Run tests and lint

Run: `cd packages/popover && pnpm test && pnpm lint`
Expected: PASS

### Step 6: Commit

```
feat(popover): add @bezny/popover package
```

---

## Task 6: Integrate all packages into docs site

**Files:**
- Modify: `packages/docs/package.json` — add 5 new workspace deps
- Modify: `packages/docs/src/components/LivePreview.tsx` — add all new components to scope
- Modify: `packages/docs/src/data/sidebar.ts` — add sidebar entries
- Create: `packages/docs/src/content/docs/components/badge.mdx`
- Create: `packages/docs/src/content/docs/components/tabs.mdx`
- Create: `packages/docs/src/content/docs/components/tooltip.mdx`
- Create: `packages/docs/src/content/docs/components/pagination.mdx`
- Create: `packages/docs/src/content/docs/components/popover.mdx`

### Step 1: Add workspace deps to docs package.json

Add to `dependencies`:
```json
"@bezny/badge": "workspace:*",
"@bezny/pagination": "workspace:*",
"@bezny/popover": "workspace:*",
"@bezny/tabs": "workspace:*",
"@bezny/tooltip": "workspace:*",
```

### Step 2: Update LivePreview.tsx scope

Add imports:
```tsx
import { Badge } from "@bezny/badge";
import { Pagination } from "@bezny/pagination";
import { Popover } from "@bezny/popover";
import { Tab, TabList, TabPanel, Tabs } from "@bezny/tabs";
import { Tooltip } from "@bezny/tooltip";
```

Add to scope object:
```tsx
Badge: Badge,
Pagination: Pagination,
Popover: Popover,
Tab: Tab,
TabList: TabList,
TabPanel: TabPanel,
Tabs: Tabs,
Tooltip: Tooltip,
```

### Step 3: Add sidebar entries

Add to the Components items array (alphabetical order):
```ts
{ label: "Badge", href: "/components/badge/" },
// (between Button and Card)
{ label: "Pagination", href: "/components/pagination/" },
// (between Overlay and Paragraph)
{ label: "Popover", href: "/components/popover/" },
// (after Paragraph)
{ label: "Tabs", href: "/components/tabs/" },
// (after Switch)
{ label: "Tooltip", href: "/components/tooltip/" },
// (after Tabs)
```

### Step 4: Create badge.mdx

```mdx
---
title: Badge
---

import LivePreview from "../../../components/LivePreview";

Inline label for statuses, tags, and categories.

\`\`\`tsx
import { Badge } from "@bezny/badge";
\`\`\`

## Examples

### Default

<LivePreview client:load code={'<Badge>Default</Badge>'} />

### Variants

<LivePreview client:load code={'<div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>\n  <Badge>Default</Badge>\n  <Badge variant="success">Success</Badge>\n  <Badge variant="warning">Warning</Badge>\n  <Badge variant="danger">Danger</Badge>\n  <Badge variant="info">Info</Badge>\n</div>'} />

## API Reference

### Badge

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "success" \| "warning" \| "danger" \| "info"` | `"default"` | Visual style variant |
| `className` | `ClassValue` | — | Additional CSS classes |
| `children` | `ReactNode` | — | Badge content |
```

### Step 5: Create tabs.mdx

```mdx
---
title: Tabs
---

import LivePreview from "../../../components/LivePreview";

Tabbed interface using compound components with context-based state.

\`\`\`tsx
import { Tabs } from "@bezny/tabs";
\`\`\`

## Examples

### Basic Tabs

<LivePreview client:load code={'<Tabs defaultValue="one">\n  <Tabs.List aria-label="Demo tabs">\n    <Tabs.Tab value="one">Tab One</Tabs.Tab>\n    <Tabs.Tab value="two">Tab Two</Tabs.Tab>\n    <Tabs.Tab value="three">Tab Three</Tabs.Tab>\n  </Tabs.List>\n  <Tabs.Panel value="one">Content for tab one.</Tabs.Panel>\n  <Tabs.Panel value="two">Content for tab two.</Tabs.Panel>\n  <Tabs.Panel value="three">Content for tab three.</Tabs.Panel>\n</Tabs>'} />

## API Reference

### Tabs

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultValue` | `string` | `""` | Initially active tab (uncontrolled) |
| `value` | `string` | — | Active tab (controlled) |
| `onValueChange` | `(value: string) => void` | — | Called when active tab changes |
| `className` | `ClassValue` | — | Additional CSS classes |

### Tabs.List

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `aria-label` | `string` | — | Accessible label for the tab list |
| `className` | `ClassValue` | — | Additional CSS classes |

### Tabs.Tab

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | **required** | Unique identifier for this tab |
| `className` | `ClassValue` | — | Additional CSS classes |

### Tabs.Panel

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | **required** | Matches the corresponding Tab value |
| `className` | `ClassValue` | — | Additional CSS classes |
```

### Step 6: Create tooltip.mdx

```mdx
---
title: Tooltip
---

import LivePreview from "../../../components/LivePreview";

Positioned tooltip triggered on hover or focus.

\`\`\`tsx
import { Tooltip } from "@bezny/tooltip";
\`\`\`

## Examples

### Basic Tooltip

<LivePreview client:load noInline code={'function Demo() {\n  const ref = React.useRef(null);\n  const [open, setOpen] = React.useState(false);\n  return (\n    <>\n      <Button\n        ref={ref}\n        onMouseEnter={() => setOpen(true)}\n        onMouseLeave={() => setOpen(false)}\n        onFocus={() => setOpen(true)}\n        onBlur={() => setOpen(false)}\n        aria-describedby="demo-tooltip"\n      >\n        Hover me\n      </Button>\n      <Tooltip id="demo-tooltip" open={open} anchorRef={ref}>\n        Helpful tooltip text\n      </Tooltip>\n    </>\n  );\n}\nrender(<Demo />);'} />

## API Reference

### Tooltip

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `anchorRef` | `RefObject<HTMLElement \| null>` | **required** | Reference to the trigger element |
| `open` | `boolean` | **required** | Whether the tooltip is visible |
| `placement` | `"top" \| "bottom"` | `"top"` | Tooltip placement relative to anchor |
| `id` | `string` | — | ID for aria-describedby association |
| `className` | `ClassValue` | — | Additional CSS classes |
| `children` | `ReactNode` | — | Tooltip content |
```

### Step 7: Create pagination.mdx

```mdx
---
title: Pagination
---

import LivePreview from "../../../components/LivePreview";

Pagination controls for navigating list views.

\`\`\`tsx
import { Pagination } from "@bezny/pagination";
\`\`\`

## Examples

### Basic Pagination

<LivePreview client:load noInline code={'function Demo() {\n  const [page, setPage] = React.useState(1);\n  return <Pagination page={page} totalPages={10} onPageChange={setPage} />;\n}\nrender(<Demo />);'} />

### With More Siblings

<LivePreview client:load noInline code={'function Demo() {\n  const [page, setPage] = React.useState(5);\n  return <Pagination page={page} totalPages={20} siblings={2} onPageChange={setPage} />;\n}\nrender(<Demo />);'} />

## API Reference

### Pagination

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `page` | `number` | **required** | Current active page (1-indexed) |
| `totalPages` | `number` | **required** | Total number of pages |
| `onPageChange` | `(page: number) => void` | **required** | Called when page changes |
| `siblings` | `number` | `1` | Number of visible pages around current |
| `className` | `ClassValue` | — | Additional CSS classes |
```

### Step 8: Create popover.mdx

```mdx
---
title: Popover
---

import LivePreview from "../../../components/LivePreview";

Positioned content panel triggered by click, richer than a tooltip but lighter than a dialog.

\`\`\`tsx
import { Popover } from "@bezny/popover";
\`\`\`

## Examples

### Basic Popover

<LivePreview client:load noInline code={'function Demo() {\n  const ref = React.useRef(null);\n  const [open, setOpen] = React.useState(false);\n  return (\n    <>\n      <Button ref={ref} onClick={() => setOpen(!open)}>\n        Toggle popover\n      </Button>\n      <Popover open={open} onClose={() => setOpen(false)} anchorRef={ref}>\n        <Paragraph>Rich popover content goes here.</Paragraph>\n      </Popover>\n    </>\n  );\n}\nrender(<Demo />);'} />

## API Reference

### Popover

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `anchorRef` | `RefObject<HTMLElement \| null>` | **required** | Reference to the trigger element |
| `open` | `boolean` | **required** | Whether the popover is visible |
| `onClose` | `() => void` | **required** | Called when the popover should close |
| `align` | `"left" \| "right"` | `"left"` | Horizontal alignment relative to anchor |
| `className` | `ClassValue` | — | Additional CSS classes |
| `children` | `ReactNode` | — | Popover content |
```

### Step 9: Run pnpm install and build

Run: `pnpm install && pnpm build`
Expected: All packages build successfully

### Step 10: Run lint across all new packages

Run: `pnpm --filter @bezny/badge --filter @bezny/tabs --filter @bezny/tooltip --filter @bezny/pagination --filter @bezny/popover lint`
Expected: PASS

### Step 11: Run all tests

Run: `pnpm --filter @bezny/badge --filter @bezny/tabs --filter @bezny/tooltip --filter @bezny/pagination --filter @bezny/popover test`
Expected: PASS

### Step 12: Commit

```
feat(docs): integrate badge, tabs, tooltip, pagination, and popover into docs site
```
