# Theme Settings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `ButtonGroup` segmented control to `@bezny/switches` and use it to build a `ThemeSettings` panel in the docs site replacing `ColourSelector`, adding dark/light/auto, reduced motion, and reduced transparency controls.

**Architecture:** New `ButtonGroup` + `ButtonGroupOption` components in `@bezny/switches` follow the existing `RadioGroup`/`Radio` pattern (context + fieldset). The docs `ColourSelector` is renamed to `ThemeSettings`, keeping existing hue sliders and adding three `ButtonGroup` controls. Preferences are persisted in localStorage and applied as CSS classes on `:root`. A pre-hydration script in `BaseLayout.astro` prevents flash.

**Tech Stack:** React 19, SCSS modules, CSS custom properties (OKLch), clsx, vitest + testing-library

---

### Task 1: ButtonGroup component tokens in `@bezny/styles`

**Files:**
- Modify: `packages/styles/src/_components.scss:53-57` (after Switch tokens)

**Step 1: Add component tokens**

Insert after the Switch section (line 57) in `_components.scss`:

```scss
  // ButtonGroup
  --#{$prefix}-button-group-bg: var(--#{$prefix}-surface-raised);
  --#{$prefix}-button-group-border: var(--#{$prefix}-border);
  --#{$prefix}-button-group-color: var(--#{$prefix}-text);
  --#{$prefix}-button-group-selected-bg: var(--#{$prefix}-interactive);
  --#{$prefix}-button-group-selected-color: var(--#{$prefix}-text-on-primary);
```

**Step 2: Commit**

```bash
git add packages/styles/src/_components.scss
git commit -m "feat(styles): add ButtonGroup component tokens"
```

---

### Task 2: ButtonGroupContext

**Files:**
- Create: `packages/switches/src/ButtonGroupContext.ts`

**Step 1: Create the context file**

```typescript
import { createContext, useContext } from "react";

export type ButtonGroupContextValue = {
	disabled?: boolean;
	onChange?: (value: string) => void;
	value?: string;
};

export const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);

export function useButtonGroup() {
	return useContext(ButtonGroupContext);
}
```

**Step 2: Commit**

```bash
git add packages/switches/src/ButtonGroupContext.ts
git commit -m "feat(switches): add ButtonGroupContext"
```

---

### Task 3: ButtonGroupOption component

**Files:**
- Create: `packages/switches/src/ButtonGroupOption.tsx`
- Create: `packages/switches/src/ButtonGroupOption.module.scss`

**Step 1: Create the SCSS module**

```scss
@use 'grid' as *;

.option {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: size(1) size(3);
	border: 1px solid var(--bzn-button-group-border);
	background: var(--bzn-button-group-bg);
	color: var(--bzn-button-group-color);
	font: inherit;
	font-size: 0.85em;
	cursor: pointer;
	user-select: none;
	transition: background-color var(--bzn-transition), color var(--bzn-transition);
	margin-left: -1px;

	&:first-child {
		margin-left: 0;
		border-radius: size(1.5) 0 0 size(1.5);
	}

	&:last-child {
		border-radius: 0 size(1.5) size(1.5) 0;
	}

	&:focus-visible {
		outline: 2px solid var(--bzn-button-group-selected-bg);
		outline-offset: 2px;
		z-index: 1;
	}
}

.selected {
	background: var(--bzn-button-group-selected-bg);
	color: var(--bzn-button-group-selected-color);
	border-color: var(--bzn-button-group-selected-bg);
	z-index: 1;
}

.disabled {
	cursor: not-allowed;
	opacity: 0.5;
}
```

**Step 2: Create the component**

```tsx
import clsx, { type ClassValue } from "clsx";
import { type ReactNode } from "react";
import styles from "./ButtonGroupOption.module.scss";
import { useButtonGroup } from "./ButtonGroupContext";

export type ButtonGroupOptionProps = {
	children: ReactNode;
	className?: ClassValue;
	disabled?: boolean;
	value: string;
};

export function ButtonGroupOption({ children, className, disabled, value }: ButtonGroupOptionProps) {
	const group = useButtonGroup();
	const isDisabled = disabled ?? group?.disabled;
	const isSelected = group?.value === value;

	const handleClick = () => {
		if (!isDisabled) {
			group?.onChange?.(value);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		const target = e.currentTarget;
		let sibling: Element | null = null;

		if (e.key === "ArrowRight" || e.key === "ArrowDown") {
			e.preventDefault();
			sibling = target.nextElementSibling ?? target.parentElement?.firstElementChild ?? null;
		} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
			e.preventDefault();
			sibling = target.previousElementSibling ?? target.parentElement?.lastElementChild ?? null;
		}

		if (sibling instanceof HTMLElement) {
			sibling.focus();
			sibling.click();
		}
	};

	return (
		<button
			aria-checked={isSelected}
			className={clsx(styles.option, { [styles.selected]: isSelected, [styles.disabled]: isDisabled }, className)}
			disabled={isDisabled}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			role="radio"
			tabIndex={isSelected ? 0 : -1}
			type="button"
		>
			{children}
		</button>
	);
}
```

**Step 3: Commit**

```bash
git add packages/switches/src/ButtonGroupOption.tsx packages/switches/src/ButtonGroupOption.module.scss
git commit -m "feat(switches): add ButtonGroupOption component"
```

---

### Task 4: ButtonGroup container component

**Files:**
- Create: `packages/switches/src/ButtonGroup.tsx`
- Create: `packages/switches/src/ButtonGroup.module.scss`

**Step 1: Create the SCSS module**

```scss
@use 'grid' as *;

.group {
	display: inline-flex;
	border: none;
	padding: 0;
	margin: 0;
}

.legend {
	color: var(--bzn-text);
	font-weight: 600;
	margin-bottom: size(1);
}
```

**Step 2: Create the component**

```tsx
import clsx, { type ClassValue } from "clsx";
import { type ReactNode, useCallback, useMemo } from "react";
import styles from "./ButtonGroup.module.scss";
import { ButtonGroupContext, type ButtonGroupContextValue } from "./ButtonGroupContext";

export type ButtonGroupProps = {
	children: ReactNode;
	className?: ClassValue;
	defaultValue?: string;
	disabled?: boolean;
	legend?: string;
	onChange?: (value: string) => void;
	value?: string;
};

export function ButtonGroup({ children, className, defaultValue, disabled, legend, onChange, value }: ButtonGroupProps) {
	const handleChange = useCallback(
		(itemValue: string) => {
			onChange?.(itemValue);
		},
		[onChange],
	);

	const ctx = useMemo<ButtonGroupContextValue>(
		() => ({ disabled, onChange: handleChange, value: value ?? defaultValue }),
		[defaultValue, disabled, handleChange, value],
	);

	return (
		<ButtonGroupContext.Provider value={ctx}>
			<fieldset className={clsx(styles.group, className)} disabled={disabled} role="radiogroup">
				{legend ? <legend className={styles.legend}>{legend}</legend> : null}
				{children}
			</fieldset>
		</ButtonGroupContext.Provider>
	);
}
```

**Step 3: Commit**

```bash
git add packages/switches/src/ButtonGroup.tsx packages/switches/src/ButtonGroup.module.scss
git commit -m "feat(switches): add ButtonGroup container component"
```

---

### Task 5: Export ButtonGroup from package index

**Files:**
- Modify: `packages/switches/src/index.ts`

**Step 1: Add exports**

Add these two lines to `packages/switches/src/index.ts`:

```typescript
export * from "./ButtonGroup";
export * from "./ButtonGroupOption";
```

**Step 2: Build and verify**

```bash
cd packages/switches && pnpm build
```

Expected: Build succeeds, `dist/` contains ButtonGroup exports.

**Step 3: Commit**

```bash
git add packages/switches/src/index.ts
git commit -m "feat(switches): export ButtonGroup and ButtonGroupOption"
```

---

### Task 6: Add tests for ButtonGroup

**Files:**
- Create: `packages/switches/vitest.config.ts`
- Create: `packages/switches/src/test/setup.ts`
- Create: `packages/switches/src/ButtonGroup.test.tsx`

**Step 1: Create vitest config**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
	},
});
```

**Step 2: Create test setup**

```typescript
import "@testing-library/jest-dom/vitest";
```

**Step 3: Write tests**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ButtonGroup } from "./ButtonGroup";
import { ButtonGroupOption } from "./ButtonGroupOption";

describe("ButtonGroup", () => {
	it("renders options with radio roles", () => {
		render(
			<ButtonGroup value="a">
				<ButtonGroupOption value="a">Alpha</ButtonGroupOption>
				<ButtonGroupOption value="b">Beta</ButtonGroupOption>
			</ButtonGroup>,
		);
		expect(screen.getByRole("radio", { name: "Alpha" })).toBeInTheDocument();
		expect(screen.getByRole("radio", { name: "Beta" })).toBeInTheDocument();
	});

	it("marks the selected option as checked", () => {
		render(
			<ButtonGroup value="b">
				<ButtonGroupOption value="a">Alpha</ButtonGroupOption>
				<ButtonGroupOption value="b">Beta</ButtonGroupOption>
			</ButtonGroup>,
		);
		expect(screen.getByRole("radio", { name: "Alpha" })).toHaveAttribute("aria-checked", "false");
		expect(screen.getByRole("radio", { name: "Beta" })).toHaveAttribute("aria-checked", "true");
	});

	it("calls onChange when an option is clicked", async () => {
		const onChange = vi.fn();
		render(
			<ButtonGroup value="a" onChange={onChange}>
				<ButtonGroupOption value="a">Alpha</ButtonGroupOption>
				<ButtonGroupOption value="b">Beta</ButtonGroupOption>
			</ButtonGroup>,
		);
		await userEvent.click(screen.getByRole("radio", { name: "Beta" }));
		expect(onChange).toHaveBeenCalledWith("b");
	});

	it("renders a legend when provided", () => {
		render(
			<ButtonGroup value="a" legend="Pick one">
				<ButtonGroupOption value="a">Alpha</ButtonGroupOption>
			</ButtonGroup>,
		);
		expect(screen.getByText("Pick one")).toBeInTheDocument();
	});

	it("disables all options when group is disabled", () => {
		render(
			<ButtonGroup value="a" disabled>
				<ButtonGroupOption value="a">Alpha</ButtonGroupOption>
				<ButtonGroupOption value="b">Beta</ButtonGroupOption>
			</ButtonGroup>,
		);
		expect(screen.getByRole("radio", { name: "Alpha" })).toBeDisabled();
		expect(screen.getByRole("radio", { name: "Beta" })).toBeDisabled();
	});

	it("navigates with arrow keys", async () => {
		const onChange = vi.fn();
		render(
			<ButtonGroup value="a" onChange={onChange}>
				<ButtonGroupOption value="a">Alpha</ButtonGroupOption>
				<ButtonGroupOption value="b">Beta</ButtonGroupOption>
			</ButtonGroup>,
		);
		screen.getByRole("radio", { name: "Alpha" }).focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(onChange).toHaveBeenCalledWith("b");
	});
});
```

**Step 4: Run tests**

```bash
cd packages/switches && pnpm test
```

Expected: All 6 tests pass.

**Step 5: Commit**

```bash
git add packages/switches/vitest.config.ts packages/switches/src/test/setup.ts packages/switches/src/ButtonGroup.test.tsx
git commit -m "test(switches): add ButtonGroup tests"
```

---

### Task 7: ThemeSettings component — replace ColourSelector

**Files:**
- Delete: `packages/docs/src/components/ColourSelector.tsx`
- Create: `packages/docs/src/components/ThemeSettings.tsx`
- Modify: `packages/docs/src/components/DocsShell.tsx`

**Step 1: Create ThemeSettings.tsx**

This component keeps all existing hue slider logic from `ColourSelector` and adds the three `ButtonGroup` controls. The preference logic:

```tsx
import { ButtonGroup, ButtonGroupOption } from "@bezny/switches";
import { useCallback, useEffect, useRef, useState } from "react";
import { applyThemeOverrides, clearThemeOverrides } from "../lib/shade-generation.js";

const LS_PRIMARY = "bzn-docs-primary-hue";
const LS_SECONDARY = "bzn-docs-secondary-hue";
const LS_OFFSET = "bzn-docs-hue-offset";
const LS_COLOR_SCHEME = "bzn-docs-color-scheme";
const LS_REDUCED_MOTION = "bzn-docs-reduced-motion";
const LS_REDUCED_TRANSPARENCY = "bzn-docs-reduced-transparency";

const DEFAULT_PRIMARY = 10;
const DEFAULT_OFFSET = 60;
const HUE_OFFSETS = [30, 60, 90, 120, 150, 180] as const;

type HueOffset = (typeof HUE_OFFSETS)[number] | "unlocked";
type TriState = "auto" | "yes" | "no";
type ColorScheme = "auto" | "light" | "dark";

function parseHueOffset(value: string | null): HueOffset {
	if (value === "unlocked") return "unlocked";
	if (value) {
		const num = Number(value);
		if (HUE_OFFSETS.includes(num as (typeof HUE_OFFSETS)[number])) return num as (typeof HUE_OFFSETS)[number];
	}
	return DEFAULT_OFFSET;
}

function readStorage() {
	const primary = Number(localStorage.getItem(LS_PRIMARY)) || DEFAULT_PRIMARY;
	const hueOffset = parseHueOffset(localStorage.getItem(LS_OFFSET));
	const secondary =
		hueOffset === "unlocked"
			? Number(localStorage.getItem(LS_SECONDARY)) || primary + DEFAULT_OFFSET
			: primary + hueOffset;
	return { primaryHue: primary, secondaryHue: secondary, hueOffset };
}

const CLASS_MAP = {
	colorScheme: { auto: [], light: ["bzn--light"], dark: ["bzn--dark"] },
	reducedMotion: { auto: [], yes: ["bzn--reduce-motion"], no: ["bzn--allow-motion"] },
	reducedTransparency: { auto: [], yes: ["bzn--reduce-transparency"], no: ["bzn--allow-transparency"] },
} as const;

function applyPreferenceClass(key: keyof typeof CLASS_MAP, value: string) {
	const el = document.documentElement;
	const map = CLASS_MAP[key];
	for (const classes of Object.values(map)) {
		el.classList.remove(...classes);
	}
	const classes = map[value as keyof typeof map];
	if (classes?.length) {
		el.classList.add(...classes);
	}
}

// --- Inline styles (kept from ColourSelector) ---

const sliderTrack: React.CSSProperties = {
	position: "relative",
	height: 24,
	borderRadius: 12,
	background:
		"linear-gradient(to right, oklch(60% 0.15 0), oklch(60% 0.15 30), oklch(60% 0.15 60), oklch(60% 0.15 90), oklch(60% 0.15 120), oklch(60% 0.15 150), oklch(60% 0.15 180), oklch(60% 0.15 210), oklch(60% 0.15 240), oklch(60% 0.15 270), oklch(60% 0.15 300), oklch(60% 0.15 330), oklch(60% 0.15 360))",
};

const sliderInput: React.CSSProperties = {
	position: "absolute",
	inset: 0,
	width: "100%",
	height: "100%",
	margin: 0,
	appearance: "none",
	WebkitAppearance: "none",
	background: "transparent",
	cursor: "pointer",
};

const sliderThumbCss = `
	input[type="range"].bzn-hue-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: white;
		border: 2px solid rgba(0,0,0,0.3);
		box-shadow: 0 1px 3px rgba(0,0,0,0.2);
	}
	input[type="range"].bzn-hue-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: white;
		border: 2px solid rgba(0,0,0,0.3);
		box-shadow: 0 1px 3px rgba(0,0,0,0.2);
	}
`;

const sectionHeading: React.CSSProperties = {
	fontSize: 13,
	fontWeight: 600,
	marginBottom: 12,
	color: "var(--bzn-text)",
};

const fieldLabel: React.CSSProperties = {
	fontSize: 12,
	color: "var(--bzn-text-muted)",
	display: "block",
	marginBottom: 8,
};

export default function ThemeSettings() {
	const [primaryHue, setPrimaryHue] = useState(DEFAULT_PRIMARY);
	const [secondaryHue, setSecondaryHue] = useState(DEFAULT_PRIMARY + DEFAULT_OFFSET);
	const [hueOffset, setHueOffset] = useState<HueOffset>(DEFAULT_OFFSET);
	const [colorScheme, setColorScheme] = useState<ColorScheme>("auto");
	const [reducedMotion, setReducedMotion] = useState<TriState>("auto");
	const [reducedTransparency, setReducedTransparency] = useState<TriState>("auto");
	const [open, setOpen] = useState(false);
	const detailsRef = useRef<HTMLDetailsElement>(null);
	const initialized = useRef(false);

	// Hydrate from localStorage on mount
	useEffect(() => {
		const stored = readStorage();
		setPrimaryHue(stored.primaryHue);
		setSecondaryHue(stored.secondaryHue);
		setHueOffset(stored.hueOffset);
		setColorScheme((localStorage.getItem(LS_COLOR_SCHEME) as ColorScheme) ?? "auto");
		setReducedMotion((localStorage.getItem(LS_REDUCED_MOTION) as TriState) ?? "auto");
		setReducedTransparency((localStorage.getItem(LS_REDUCED_TRANSPARENCY) as TriState) ?? "auto");
		initialized.current = true;
	}, []);

	// Apply hue overrides
	useEffect(() => {
		if (!initialized.current) return;
		applyThemeOverrides(primaryHue, secondaryHue);
		localStorage.setItem(LS_PRIMARY, String(primaryHue));
		localStorage.setItem(LS_SECONDARY, String(secondaryHue));
		localStorage.setItem(LS_OFFSET, String(hueOffset));
	}, [primaryHue, secondaryHue, hueOffset]);

	// Apply preference classes
	useEffect(() => {
		if (!initialized.current) return;
		applyPreferenceClass("colorScheme", colorScheme);
		localStorage.setItem(LS_COLOR_SCHEME, colorScheme);
	}, [colorScheme]);

	useEffect(() => {
		if (!initialized.current) return;
		applyPreferenceClass("reducedMotion", reducedMotion);
		localStorage.setItem(LS_REDUCED_MOTION, reducedMotion);
	}, [reducedMotion]);

	useEffect(() => {
		if (!initialized.current) return;
		applyPreferenceClass("reducedTransparency", reducedTransparency);
		localStorage.setItem(LS_REDUCED_TRANSPARENCY, reducedTransparency);
	}, [reducedTransparency]);

	const handlePrimaryChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const hue = Number(e.target.value);
			setPrimaryHue(hue);
			if (hueOffset !== "unlocked") setSecondaryHue(hue + hueOffset);
		},
		[hueOffset],
	);

	const handleSecondaryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSecondaryHue(Number(e.target.value));
	}, []);

	const handleOffsetChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			const value = e.target.value;
			if (value === "unlocked") {
				setHueOffset("unlocked");
			} else {
				const offset = Number(value) as (typeof HUE_OFFSETS)[number];
				setHueOffset(offset);
				setSecondaryHue(primaryHue + offset);
			}
		},
		[primaryHue],
	);

	const handleReset = useCallback(() => {
		clearThemeOverrides();
		setPrimaryHue(DEFAULT_PRIMARY);
		setSecondaryHue(DEFAULT_PRIMARY + DEFAULT_OFFSET);
		setHueOffset(DEFAULT_OFFSET);
		setColorScheme("auto");
		setReducedMotion("auto");
		setReducedTransparency("auto");
		localStorage.removeItem(LS_PRIMARY);
		localStorage.removeItem(LS_SECONDARY);
		localStorage.removeItem(LS_OFFSET);
		localStorage.removeItem(LS_COLOR_SCHEME);
		localStorage.removeItem(LS_REDUCED_MOTION);
		localStorage.removeItem(LS_REDUCED_TRANSPARENCY);
		applyPreferenceClass("colorScheme", "auto");
		applyPreferenceClass("reducedMotion", "auto");
		applyPreferenceClass("reducedTransparency", "auto");
	}, []);

	// Close on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		if (open) document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, [open]);

	return (
		<>
			<style>{sliderThumbCss}</style>
			<details
				ref={detailsRef}
				open={open}
				onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
				style={{ position: "relative", display: "inline-block" }}
			>
				<summary
					style={{
						listStyle: "none",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: 6,
					}}
				>
					<span
						style={{
							display: "inline-block",
							width: 24,
							height: 24,
							borderRadius: "50%",
							background: `oklch(50% 0.19 ${primaryHue})`,
							border: "2px solid var(--bzn-border)",
							verticalAlign: "middle",
						}}
						aria-label="Theme settings"
					/>
				</summary>
				<div
					style={{
						position: "absolute",
						right: 0,
						top: "calc(100% + 8px)",
						zIndex: 100,
						background: "var(--bzn-surface)",
						border: "1px solid var(--bzn-border)",
						borderRadius: 8,
						padding: 16,
						width: 280,
						boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
					}}
				>
					{/* Accent colours section */}
					<div style={sectionHeading}>Accent colour</div>

					<label style={{ fontSize: 12, color: "var(--bzn-text-muted)", display: "block", marginBottom: 4 }}>
						Primary — {primaryHue}°
					</label>
					<div style={sliderTrack}>
						<input
							type="range"
							min={0}
							max={360}
							value={primaryHue}
							onChange={handlePrimaryChange}
							className="bzn-hue-slider"
							style={sliderInput}
						/>
					</div>

					<div style={{ display: "flex", alignItems: "center", gap: 6, margin: "10px 0 4px" }}>
						<label style={{ fontSize: 12, color: "var(--bzn-text-muted)", flex: 1 }}>
							Secondary — {Math.round(secondaryHue % 360)}°
						</label>
						<select
							value={hueOffset}
							onChange={handleOffsetChange}
							style={{
								fontSize: 11,
								padding: "1px 4px",
								background: "var(--bzn-surface-raised)",
								color: "var(--bzn-text-muted)",
								border: "1px solid var(--bzn-border)",
								borderRadius: 4,
								cursor: "pointer",
							}}
						>
							{HUE_OFFSETS.map((o) => (
								<option key={o} value={o}>
									+{o}°
								</option>
							))}
							<option value="unlocked">Unlocked</option>
						</select>
					</div>
					<div
						style={{
							...sliderTrack,
							opacity: hueOffset === "unlocked" ? 1 : 0.4,
							pointerEvents: hueOffset === "unlocked" ? "auto" : "none",
						}}
					>
						<input
							type="range"
							min={0}
							max={360}
							value={Math.round(secondaryHue % 360)}
							onChange={handleSecondaryChange}
							disabled={hueOffset !== "unlocked"}
							className="bzn-hue-slider"
							style={sliderInput}
						/>
					</div>

					{/* Preferences section */}
					<div style={{ ...sectionHeading, marginTop: 16 }}>Preferences</div>

					<div style={fieldLabel}>Color scheme</div>
					<ButtonGroup value={colorScheme} onChange={(v) => setColorScheme(v as ColorScheme)}>
						<ButtonGroupOption value="auto">Auto</ButtonGroupOption>
						<ButtonGroupOption value="light">Light</ButtonGroupOption>
						<ButtonGroupOption value="dark">Dark</ButtonGroupOption>
					</ButtonGroup>

					<div style={{ ...fieldLabel, marginTop: 12 }}>Reduced motion</div>
					<ButtonGroup value={reducedMotion} onChange={(v) => setReducedMotion(v as TriState)}>
						<ButtonGroupOption value="auto">Auto</ButtonGroupOption>
						<ButtonGroupOption value="yes">Yes</ButtonGroupOption>
						<ButtonGroupOption value="no">No</ButtonGroupOption>
					</ButtonGroup>

					<div style={{ ...fieldLabel, marginTop: 12 }}>Reduced transparency</div>
					<ButtonGroup value={reducedTransparency} onChange={(v) => setReducedTransparency(v as TriState)}>
						<ButtonGroupOption value="auto">Auto</ButtonGroupOption>
						<ButtonGroupOption value="yes">Yes</ButtonGroupOption>
						<ButtonGroupOption value="no">No</ButtonGroupOption>
					</ButtonGroup>

					<button
						type="button"
						onClick={handleReset}
						style={{
							marginTop: 16,
							width: "100%",
							padding: "4px 0",
							fontSize: 12,
							background: "var(--bzn-surface-raised)",
							color: "var(--bzn-text-muted)",
							border: "1px solid var(--bzn-border)",
							borderRadius: 4,
							cursor: "pointer",
						}}
					>
						Reset to default
					</button>
				</div>
			</details>
		</>
	);
}
```

**Step 2: Update DocsShell.tsx**

Replace the import and usage:

```diff
-import ColourSelector from "./ColourSelector.js";
+import ThemeSettings from "./ThemeSettings.js";
```

```diff
-				<ColourSelector />
+				<ThemeSettings />
```

**Step 3: Delete ColourSelector.tsx**

```bash
rm packages/docs/src/components/ColourSelector.tsx
```

**Step 4: Commit**

```bash
git add packages/docs/src/components/ThemeSettings.tsx packages/docs/src/components/DocsShell.tsx
git rm packages/docs/src/components/ColourSelector.tsx
git commit -m "feat(docs): replace ColourSelector with ThemeSettings panel"
```

---

### Task 8: Update BaseLayout.astro pre-hydration script

**Files:**
- Modify: `packages/docs/src/layouts/BaseLayout.astro:21-44`

**Step 1: Extend the inline script**

Add preference class application after the existing hue override logic. The full script becomes:

```html
<script is:inline>
	(function() {
		var LS_PRIMARY = 'bzn-docs-primary-hue';
		var LS_SECONDARY = 'bzn-docs-secondary-hue';
		var LS_OFFSET = 'bzn-docs-hue-offset';
		var stored = localStorage.getItem(LS_PRIMARY);
		var el = document.documentElement;

		if (stored) {
			var LIGHTNESS = [97,93,85,73,62,50,45,38,30,23,15];
			var CHROMA = [0.1,0.25,0.4,0.65,0.85,1.0,1.0,0.9,0.75,0.6,0.4];
			var SHADES = [50,100,200,300,400,500,600,700,800,900,950];
			var chroma = 0.19;
			var primaryHue = Number(stored);
			var offsetStr = localStorage.getItem(LS_OFFSET);
			var secondaryHue = offsetStr === 'unlocked'
				? Number(localStorage.getItem(LS_SECONDARY)) || primaryHue + 60
				: primaryHue + (Number(offsetStr) || 60);
			for (var i = 0; i < SHADES.length; i++) {
				var c = chroma * CHROMA[i];
				el.style.setProperty('--bzn-primary-' + SHADES[i], 'oklch(' + LIGHTNESS[i] + '% ' + c + ' ' + primaryHue + ')');
				el.style.setProperty('--bzn-secondary-' + SHADES[i], 'oklch(' + LIGHTNESS[i] + '% ' + c + ' ' + secondaryHue + ')');
			}
		}

		// Apply preference classes before first paint
		var prefs = {
			'bzn-docs-color-scheme': { light: 'bzn--light', dark: 'bzn--dark' },
			'bzn-docs-reduced-motion': { yes: 'bzn--reduce-motion', no: 'bzn--allow-motion' },
			'bzn-docs-reduced-transparency': { yes: 'bzn--reduce-transparency', no: 'bzn--allow-transparency' }
		};
		for (var key in prefs) {
			var val = localStorage.getItem(key);
			if (val && prefs[key][val]) {
				el.classList.add(prefs[key][val]);
			}
		}
	})();
</script>
```

**Step 2: Commit**

```bash
git add packages/docs/src/layouts/BaseLayout.astro
git commit -m "feat(docs): apply theme preferences before hydration"
```

---

### Task 9: Add @bezny/switches dependency to docs and verify

**Files:**
- Modify: `packages/docs/package.json`

**Step 1: Add dependency**

```bash
cd /home/just-paja/Work/bezny && pnpm --filter @bezny/docs add @bezny/switches@workspace:*
```

**Step 2: Build everything and verify**

```bash
pnpm build
```

Expected: All packages build successfully.

**Step 3: Start dev server and visually verify**

```bash
cd packages/docs && pnpm dev
```

Check that:
- The colour circle in navbar still opens the panel
- Hue sliders work as before
- Three new ButtonGroup controls appear under "Preferences"
- Clicking "Dark" adds `.bzn--dark` to `<html>` and switches to dark mode
- Clicking "Light" adds `.bzn--light` and switches to light mode
- Clicking "Auto" removes forced classes, falls back to OS preference
- Same for reduced motion and reduced transparency
- "Reset to default" clears all preferences
- Refreshing the page restores saved preferences without flash

**Step 4: Commit dependency change**

```bash
git add packages/docs/package.json pnpm-lock.yaml
git commit -m "chore(docs): add @bezny/switches dependency"
```
