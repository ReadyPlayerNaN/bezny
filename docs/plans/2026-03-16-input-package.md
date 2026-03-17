# Input Package Extraction — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract Input from `@bezny/forms` into a new `@bezny/input` package with individual typed input components, replace StatusMessage with Alert, and add documentation.

**Architecture:** Base internal `Input` component handles shared logic (floating label, validation via Alert, wrapper pattern). Typed components are thin wrappers that fix `type` and narrow the props. FileInput/ImageInput have a different onChange signature returning `FileList | null`.

**Tech Stack:** React 19, TypeScript, Vite, SCSS modules, Vitest, Astro MDX docs

---

### Task 1: Scaffold `@bezny/input` package

**Files:**
- Create: `packages/input/package.json`
- Create: `packages/input/vite.config.ts`
- Create: `packages/input/vitest.config.ts`
- Create: `packages/input/tsconfig.json`
- Create: `packages/input/src/vite-env.d.ts`
- Create: `packages/input/src/test/setup.ts`
- Create: `packages/input/src/index.ts`

**Step 1: Create package.json**

```json
{
	"name": "@bezny/input",
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
		"@bezny/alert": "workspace:*",
		"@bezny/core": "workspace:*",
		"clsx": "catalog:"
	},
	"devDependencies": {
		"@testing-library/jest-dom": "catalog:",
		"@testing-library/react": "catalog:",
		"@types/react": "catalog:",
		"@types/react-dom": "catalog:",
		"@vitejs/plugin-react": "catalog:",
		"@vitest/coverage-v8": "catalog:",
		"jsdom": "catalog:",
		"react": "catalog:",
		"react-dom": "catalog:",
		"sass": "catalog:",
		"typescript": "catalog:",
		"vite": "catalog:",
		"vite-plugin-dts": "catalog:",
		"vitest": "catalog:"
	}
}
```

**Step 2: Create vite.config.ts**

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
			external: ["react", "react-dom", "clsx", /^@bezny\//],
			output: {
				assetFileNames: "[name][extname]",
			},
		},
	},
});
```

**Step 3: Create vitest.config.ts**

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

**Step 4: Create tsconfig.json**

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

**Step 5: Create src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />
```

**Step 6: Create src/test/setup.ts**

```ts
import "@testing-library/jest-dom/vitest";
```

**Step 7: Create empty src/index.ts**

```ts
```

**Step 8: Install dependencies**

Run: `pnpm install`

**Step 9: Verify build**

Run: `cd packages/input && pnpm build`
Expected: Build succeeds (empty output)

**Step 10: Commit**

```bash
git add packages/input/
git commit -m "feat(input): scaffold @bezny/input package"
```

---

### Task 2: Create base Input component and TextInput

**Files:**
- Create: `packages/input/src/Input.tsx`
- Create: `packages/input/src/Input.module.scss`
- Create: `packages/input/src/TextInput.tsx`
- Create: `packages/input/src/TextInput.test.tsx`
- Modify: `packages/input/src/index.ts`

**Step 1: Write the failing test for TextInput**

Create `packages/input/src/TextInput.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TextInput } from "./TextInput";

describe("TextInput", () => {
	it("renders an input with type text", () => {
		render(<TextInput />);
		expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
	});

	it("renders with a floating label", () => {
		render(<TextInput label="Username" />);
		expect(screen.getByLabelText("Username")).toBeInTheDocument();
	});

	it("calls onChange with string value", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TextInput label="Name" onChange={onChange} />);
		await user.type(screen.getByLabelText("Name"), "a");
		expect(onChange).toHaveBeenCalledWith("a");
	});

	it("renders validation alert when status and statusMessage are set", () => {
		render(<TextInput label="Email" status="error" statusMessage="Required" />);
		expect(screen.getByRole("alert")).toHaveTextContent("Required");
	});

	it("does not expose a type prop", () => {
		// @ts-expect-error - type prop should not be accepted
		render(<TextInput type="number" />);
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/input && pnpm test`
Expected: FAIL — TextInput module not found

**Step 3: Create Input.module.scss**

Copy from `packages/forms/src/Input.module.scss` (the shared styles for all keyboard inputs):

```scss
@use 'grid' as *;
@use 'typography' as *;
@use 'reactions' as *;
@use 'validation' as *;

.input {
  @include input-reactions;

  border-width: 1px;
  border-style: solid;
  border-radius: size(1);
  font-family: inherit;
  font-size: font-size(1);
  line-height: size(6);
  padding: size(2) size(3);
  flex-grow: 1;

  &::placeholder {
    color: var(--bzn-input-placeholder);
  }
}

.statusError {
  @include status-border(error);
}

.statusWarning {
  @include status-border(warning);
}

.statusSuccess {
  @include status-border(success);
}

.wrapper {
  display: flex;
  position: relative;

  .input {
    padding: size(5) size(3) size(1);

    &::placeholder {
      color: transparent;
    }

    &:focus + .label,
    &:not(:placeholder-shown) + .label {
      transform: translateY(calc(-1 * size(1.25)));
      font-size: size(3);
      color: var(--bzn-input-label-focused);
    }

    &:not(:focus):not(:placeholder-shown) + .label {
      color: var(--bzn-input-label-color);
    }

    &.statusError:focus + .label,
    &.statusError:not(:placeholder-shown) + .label {
      @include status-label(error);
    }

    &.statusWarning:focus + .label,
    &.statusWarning:not(:placeholder-shown) + .label {
      @include status-label(warning);
    }

    &.statusSuccess:focus + .label,
    &.statusSuccess:not(:placeholder-shown) + .label {
      @include status-label(success);
    }
  }
}

.label {
  position: absolute;
  top: size(1);
  left: size(3);
  color: var(--bzn-input-label-color);
  font-size: font-size(1);
  line-height: size(6);
  transform: translateY(size(2));
  transition:
    transform var(--bzn-transition),
    font-size var(--bzn-transition),
    color var(--bzn-transition);
  pointer-events: none;
}
```

**Step 4: Create base Input.tsx**

This is an internal component — not exported from the package. Uses Alert instead of StatusMessage.

```tsx
import { Alert } from "@bezny/alert";
import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, type ComponentPropsWithoutRef, useId } from "react";
import styles from "./Input.module.scss";

type ValidationStatus = "error" | "warning" | "success";

type NativeInputProps = Omit<ComponentPropsWithoutRef<"input">, "onChange" | "className">;

export type InputProps = NativeInputProps & {
	className?: ClassValue;
	label?: string;
	onChange?: (value: string) => void;
	status?: ValidationStatus;
	statusMessage?: string;
};

export function Input({
	autoFocus,
	className,
	defaultValue,
	disabled,
	label,
	name,
	onChange,
	placeholder,
	status,
	statusMessage,
	type = "text",
	value,
	...rest
}: InputProps) {
	const id = useId();
	const useWrapper = Boolean(label || status || statusMessage);

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		onChange?.(event.target.value);
	}

	if (useWrapper) {
		return (
			<div className={clsx(styles.wrapper, className)}>
				<input
					{...rest}
					autoFocus={autoFocus}
					className={clsx(styles.input, {
						[styles.statusError]: status === "error",
						[styles.statusWarning]: status === "warning",
						[styles.statusSuccess]: status === "success",
					})}
					defaultValue={defaultValue}
					disabled={disabled}
					id={id}
					name={name}
					onChange={handleChange}
					placeholder={label ? " " : placeholder}
					type={type}
					value={value}
				/>
				{label ? (
					<label className={styles.label} htmlFor={id}>
						{label}
					</label>
				) : null}
				{statusMessage && status ? (
					<Alert variant={status}>{statusMessage}</Alert>
				) : null}
			</div>
		);
	}

	return (
		<input
			{...rest}
			autoFocus={autoFocus}
			className={clsx(styles.input, className)}
			defaultValue={defaultValue}
			disabled={disabled}
			id={id}
			name={name}
			onChange={handleChange}
			placeholder={placeholder}
			type={type}
			value={value}
		/>
	);
}
```

**Step 5: Create TextInput.tsx**

```tsx
import { Input, type InputProps } from "./Input";

export type TextInputProps = Omit<InputProps, "type">;

export function TextInput(props: TextInputProps) {
	return <Input {...props} type="text" />;
}
```

**Step 6: Update index.ts**

```ts
export { TextInput, type TextInputProps } from "./TextInput";
```

**Step 7: Run tests**

Run: `cd packages/input && pnpm test`
Expected: All 5 tests PASS

**Step 8: Build**

Run: `cd packages/input && pnpm build`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add packages/input/src/
git commit -m "feat(input): add base Input component and TextInput"
```

---

### Task 3: Create remaining keyboard-typeable input components

**Files:**
- Create: `packages/input/src/NumberInput.tsx`
- Create: `packages/input/src/DateInput.tsx`
- Create: `packages/input/src/DateTimeInput.tsx`
- Create: `packages/input/src/TimeInput.tsx`
- Create: `packages/input/src/EmailInput.tsx`
- Create: `packages/input/src/MonthInput.tsx`
- Create: `packages/input/src/YearInput.tsx`
- Create: `packages/input/src/PasswordInput.tsx`
- Create: `packages/input/src/SearchInput.tsx`
- Create: `packages/input/src/UrlInput.tsx`
- Create: `packages/input/src/WeekInput.tsx`
- Create: `packages/input/src/KeyboardInputs.test.tsx`
- Modify: `packages/input/src/index.ts`

Each typed component follows the same pattern as TextInput. YearInput is special — uses `type="number"` with year-appropriate defaults.

**Step 1: Write the failing tests**

Create `packages/input/src/KeyboardInputs.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DateInput } from "./DateInput";
import { DateTimeInput } from "./DateTimeInput";
import { EmailInput } from "./EmailInput";
import { MonthInput } from "./MonthInput";
import { NumberInput } from "./NumberInput";
import { PasswordInput } from "./PasswordInput";
import { SearchInput } from "./SearchInput";
import { TimeInput } from "./TimeInput";
import { UrlInput } from "./UrlInput";
import { WeekInput } from "./WeekInput";
import { YearInput } from "./YearInput";

describe("NumberInput", () => {
	it("renders with type number", () => {
		render(<NumberInput label="Amount" />);
		expect(screen.getByLabelText("Amount")).toHaveAttribute("type", "number");
	});

	it("calls onChange with string value", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<NumberInput label="Amount" onChange={onChange} />);
		await user.type(screen.getByLabelText("Amount"), "5");
		expect(onChange).toHaveBeenCalledWith("5");
	});
});

describe("DateInput", () => {
	it("renders with type date", () => {
		render(<DateInput label="Birthday" />);
		expect(screen.getByLabelText("Birthday")).toHaveAttribute("type", "date");
	});
});

describe("DateTimeInput", () => {
	it("renders with type datetime-local", () => {
		render(<DateTimeInput label="Meeting" />);
		expect(screen.getByLabelText("Meeting")).toHaveAttribute("type", "datetime-local");
	});
});

describe("TimeInput", () => {
	it("renders with type time", () => {
		render(<TimeInput label="Start" />);
		expect(screen.getByLabelText("Start")).toHaveAttribute("type", "time");
	});
});

describe("EmailInput", () => {
	it("renders with type email", () => {
		render(<EmailInput label="Email" />);
		expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
	});
});

describe("MonthInput", () => {
	it("renders with type month", () => {
		render(<MonthInput label="Month" />);
		expect(screen.getByLabelText("Month")).toHaveAttribute("type", "month");
	});
});

describe("YearInput", () => {
	it("renders with type number", () => {
		render(<YearInput label="Year" />);
		expect(screen.getByLabelText("Year")).toHaveAttribute("type", "number");
	});

	it("has year-appropriate defaults", () => {
		render(<YearInput label="Year" />);
		const input = screen.getByLabelText("Year");
		expect(input).toHaveAttribute("min", "1900");
		expect(input).toHaveAttribute("max", "2100");
		expect(input).toHaveAttribute("step", "1");
	});

	it("allows overriding defaults", () => {
		render(<YearInput label="Year" min={2000} max={2050} />);
		const input = screen.getByLabelText("Year");
		expect(input).toHaveAttribute("min", "2000");
		expect(input).toHaveAttribute("max", "2050");
	});
});

describe("PasswordInput", () => {
	it("renders with type password", () => {
		render(<PasswordInput label="Password" />);
		expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
	});
});

describe("SearchInput", () => {
	it("renders with type search", () => {
		render(<SearchInput label="Search" />);
		expect(screen.getByLabelText("Search")).toHaveAttribute("type", "search");
	});
});

describe("UrlInput", () => {
	it("renders with type url", () => {
		render(<UrlInput label="Website" />);
		expect(screen.getByLabelText("Website")).toHaveAttribute("type", "url");
	});
});

describe("WeekInput", () => {
	it("renders with type week", () => {
		render(<WeekInput label="Week" />);
		expect(screen.getByLabelText("Week")).toHaveAttribute("type", "week");
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/input && pnpm test`
Expected: FAIL — modules not found

**Step 3: Create all typed components**

`packages/input/src/NumberInput.tsx`:
```tsx
import { Input, type InputProps } from "./Input";

export type NumberInputProps = Omit<InputProps, "type">;

export function NumberInput(props: NumberInputProps) {
	return <Input {...props} type="number" />;
}
```

`packages/input/src/DateInput.tsx`:
```tsx
import { Input, type InputProps } from "./Input";

export type DateInputProps = Omit<InputProps, "type">;

export function DateInput(props: DateInputProps) {
	return <Input {...props} type="date" />;
}
```

`packages/input/src/DateTimeInput.tsx`:
```tsx
import { Input, type InputProps } from "./Input";

export type DateTimeInputProps = Omit<InputProps, "type">;

export function DateTimeInput(props: DateTimeInputProps) {
	return <Input {...props} type="datetime-local" />;
}
```

`packages/input/src/TimeInput.tsx`:
```tsx
import { Input, type InputProps } from "./Input";

export type TimeInputProps = Omit<InputProps, "type">;

export function TimeInput(props: TimeInputProps) {
	return <Input {...props} type="time" />;
}
```

`packages/input/src/EmailInput.tsx`:
```tsx
import { Input, type InputProps } from "./Input";

export type EmailInputProps = Omit<InputProps, "type">;

export function EmailInput(props: EmailInputProps) {
	return <Input {...props} type="email" />;
}
```

`packages/input/src/MonthInput.tsx`:
```tsx
import { Input, type InputProps } from "./Input";

export type MonthInputProps = Omit<InputProps, "type">;

export function MonthInput(props: MonthInputProps) {
	return <Input {...props} type="month" />;
}
```

`packages/input/src/YearInput.tsx`:
```tsx
import { Input, type InputProps } from "./Input";

export type YearInputProps = Omit<InputProps, "type"> & {
	max?: number;
	min?: number;
	step?: number;
};

export function YearInput({ min = 1900, max = 2100, step = 1, ...props }: YearInputProps) {
	return <Input {...props} type="number" min={min} max={max} step={step} />;
}
```

`packages/input/src/PasswordInput.tsx`:
```tsx
import { Input, type InputProps } from "./Input";

export type PasswordInputProps = Omit<InputProps, "type">;

export function PasswordInput(props: PasswordInputProps) {
	return <Input {...props} type="password" />;
}
```

`packages/input/src/SearchInput.tsx`:
```tsx
import { Input, type InputProps } from "./Input";

export type SearchInputProps = Omit<InputProps, "type">;

export function SearchInput(props: SearchInputProps) {
	return <Input {...props} type="search" />;
}
```

`packages/input/src/UrlInput.tsx`:
```tsx
import { Input, type InputProps } from "./Input";

export type UrlInputProps = Omit<InputProps, "type">;

export function UrlInput(props: UrlInputProps) {
	return <Input {...props} type="url" />;
}
```

`packages/input/src/WeekInput.tsx`:
```tsx
import { Input, type InputProps } from "./Input";

export type WeekInputProps = Omit<InputProps, "type">;

export function WeekInput(props: WeekInputProps) {
	return <Input {...props} type="week" />;
}
```

**Step 4: Update index.ts with all exports**

```ts
export { DateInput, type DateInputProps } from "./DateInput";
export { DateTimeInput, type DateTimeInputProps } from "./DateTimeInput";
export { EmailInput, type EmailInputProps } from "./EmailInput";
export { MonthInput, type MonthInputProps } from "./MonthInput";
export { NumberInput, type NumberInputProps } from "./NumberInput";
export { PasswordInput, type PasswordInputProps } from "./PasswordInput";
export { SearchInput, type SearchInputProps } from "./SearchInput";
export { TextInput, type TextInputProps } from "./TextInput";
export { TimeInput, type TimeInputProps } from "./TimeInput";
export { UrlInput, type UrlInputProps } from "./UrlInput";
export { WeekInput, type WeekInputProps } from "./WeekInput";
export { YearInput, type YearInputProps } from "./YearInput";
```

**Step 5: Run tests**

Run: `cd packages/input && pnpm test`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add packages/input/src/
git commit -m "feat(input): add all keyboard-typeable input components"
```

---

### Task 4: Create FileInput and ImageInput

**Files:**
- Create: `packages/input/src/FileInput.tsx`
- Create: `packages/input/src/FileInput.module.scss`
- Create: `packages/input/src/ImageInput.tsx`
- Create: `packages/input/src/FileInput.test.tsx`
- Modify: `packages/input/src/index.ts`

**Step 1: Write the failing tests**

Create `packages/input/src/FileInput.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileInput } from "./FileInput";
import { ImageInput } from "./ImageInput";

describe("FileInput", () => {
	it("renders an input with type file", () => {
		render(<FileInput label="Upload" />);
		expect(screen.getByLabelText("Upload")).toHaveAttribute("type", "file");
	});

	it("calls onChange with FileList", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<FileInput label="Upload" onChange={onChange} />);
		const file = new File(["content"], "test.txt", { type: "text/plain" });
		await user.upload(screen.getByLabelText("Upload"), file);
		expect(onChange).toHaveBeenCalledWith(expect.any(FileList));
	});

	it("renders validation alert", () => {
		render(<FileInput label="Upload" status="error" statusMessage="File too large" />);
		expect(screen.getByRole("alert")).toHaveTextContent("File too large");
	});

	it("does not expose a type prop", () => {
		// @ts-expect-error - type prop should not be accepted
		render(<FileInput type="text" />);
	});
});

describe("ImageInput", () => {
	it("renders with type file and accept image/*", () => {
		render(<ImageInput label="Photo" />);
		const input = screen.getByLabelText("Photo");
		expect(input).toHaveAttribute("type", "file");
		expect(input).toHaveAttribute("accept", "image/*");
	});

	it("allows overriding accept", () => {
		render(<ImageInput label="Photo" accept="image/png,image/jpeg" />);
		expect(screen.getByLabelText("Photo")).toHaveAttribute("accept", "image/png,image/jpeg");
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/input && pnpm test`
Expected: FAIL — FileInput module not found

**Step 3: Create FileInput.module.scss**

```scss
@use 'grid' as *;
@use 'typography' as *;
@use 'reactions' as *;
@use 'validation' as *;

.input {
  @include input-reactions;

  border-width: 1px;
  border-style: solid;
  border-radius: size(1);
  font-family: inherit;
  font-size: font-size(1);
  line-height: size(6);
  padding: size(2) size(3);
  flex-grow: 1;
}

.statusError {
  @include status-border(error);
}

.statusWarning {
  @include status-border(warning);
}

.statusSuccess {
  @include status-border(success);
}

.wrapper {
  display: flex;
  flex-direction: column;
  gap: size(1);
}

.label {
  color: var(--bzn-input-label-color);
  font-size: font-size(1);
  line-height: size(6);
}
```

**Step 4: Create FileInput.tsx**

```tsx
import { Alert } from "@bezny/alert";
import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, type ComponentPropsWithoutRef, useId } from "react";
import styles from "./FileInput.module.scss";

type ValidationStatus = "error" | "warning" | "success";

type NativeInputProps = Omit<ComponentPropsWithoutRef<"input">, "onChange" | "className" | "type" | "value" | "defaultValue">;

export type FileInputProps = NativeInputProps & {
	className?: ClassValue;
	label?: string;
	onChange?: (files: FileList | null) => void;
	status?: ValidationStatus;
	statusMessage?: string;
};

export function FileInput({
	className,
	label,
	onChange,
	status,
	statusMessage,
	...rest
}: FileInputProps) {
	const id = useId();

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		onChange?.(event.target.files);
	}

	if (label || status || statusMessage) {
		return (
			<div className={clsx(styles.wrapper, className)}>
				{label ? (
					<label className={styles.label} htmlFor={id}>
						{label}
					</label>
				) : null}
				<input
					{...rest}
					className={clsx(styles.input, {
						[styles.statusError]: status === "error",
						[styles.statusWarning]: status === "warning",
						[styles.statusSuccess]: status === "success",
					})}
					id={id}
					onChange={handleChange}
					type="file"
				/>
				{statusMessage && status ? (
					<Alert variant={status}>{statusMessage}</Alert>
				) : null}
			</div>
		);
	}

	return (
		<input
			{...rest}
			className={clsx(styles.input, className)}
			id={id}
			onChange={handleChange}
			type="file"
		/>
	);
}
```

**Step 5: Create ImageInput.tsx**

```tsx
import { FileInput, type FileInputProps } from "./FileInput";

export type ImageInputProps = Omit<FileInputProps, "type">;

export function ImageInput({ accept = "image/*", ...props }: ImageInputProps) {
	return <FileInput {...props} accept={accept} />;
}
```

**Step 6: Update index.ts — add FileInput and ImageInput exports**

Add to `packages/input/src/index.ts`:
```ts
export { FileInput, type FileInputProps } from "./FileInput";
export { ImageInput, type ImageInputProps } from "./ImageInput";
```

**Step 7: Run tests**

Run: `cd packages/input && pnpm test`
Expected: All tests PASS

**Step 8: Build**

Run: `cd packages/input && pnpm build`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add packages/input/src/
git commit -m "feat(input): add FileInput and ImageInput components"
```

---

### Task 5: Update @bezny/forms — remove Input and StatusMessage, use Alert

**Files:**
- Delete: `packages/forms/src/Input.tsx`
- Delete: `packages/forms/src/Input.module.scss`
- Delete: `packages/forms/src/StatusMessage.tsx`
- Delete: `packages/forms/src/StatusMessage.module.scss`
- Modify: `packages/forms/src/TextArea.tsx`
- Modify: `packages/forms/src/Select.tsx`
- Modify: `packages/forms/src/index.ts`
- Modify: `packages/forms/package.json`

**Step 1: Update package.json — add @bezny/alert dependency**

In `packages/forms/package.json`, add `"@bezny/alert": "workspace:*"` to `dependencies`.

**Step 2: Update TextArea.tsx — replace StatusMessage with Alert**

Replace the StatusMessage import and usage:

```tsx
import { Alert } from "@bezny/alert";
import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, useId } from "react";
import styles from "./TextArea.module.scss";

type ValidationStatus = "error" | "warning" | "success";

export type TextAreaProps = {
	autoFocus?: boolean;
	className?: ClassValue;
	defaultValue?: string;
	disabled?: boolean;
	label?: string;
	name?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	rows?: number;
	status?: ValidationStatus;
	statusMessage?: string;
	value?: string;
};

export function TextArea({
	autoFocus,
	className,
	defaultValue,
	disabled,
	label,
	name,
	onChange,
	placeholder,
	rows = 3,
	status,
	statusMessage,
	value,
}: TextAreaProps) {
	const id = useId();
	const useWrapper = [label, status, statusMessage].some((v) => v !== undefined && v !== "");

	function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
		onChange?.(event.target.value);
	}

	if (useWrapper) {
		return (
			<div className={clsx(styles.wrapper, className)}>
				<textarea
					autoFocus={autoFocus}
					className={clsx(styles.textarea, {
						[styles.statusError]: status === "error",
						[styles.statusWarning]: status === "warning",
						[styles.statusSuccess]: status === "success",
					})}
					defaultValue={defaultValue}
					disabled={disabled}
					id={id}
					name={name}
					onChange={handleChange}
					placeholder={label ? " " : placeholder}
					rows={rows}
					value={value}
				/>
				{label ? (
					<label className={styles.label} htmlFor={id}>
						{label}
					</label>
				) : null}
				{statusMessage && status ? (
					<Alert variant={status}>{statusMessage}</Alert>
				) : null}
			</div>
		);
	}

	return (
		<textarea
			autoFocus={autoFocus}
			className={clsx(styles.textarea, className)}
			defaultValue={defaultValue}
			disabled={disabled}
			id={id}
			name={name}
			onChange={handleChange}
			placeholder={placeholder}
			rows={rows}
			value={value}
		/>
	);
}
```

**Step 3: Update Select.tsx — replace StatusMessage with Alert**

Replace the StatusMessage import and usage (same pattern as TextArea):

```tsx
import { Alert } from "@bezny/alert";
import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, type ComponentPropsWithoutRef, type ReactNode, useId } from "react";
import styles from "./Select.module.scss";

type ValidationStatus = "error" | "warning" | "success";

type NativeSelectProps = Omit<ComponentPropsWithoutRef<"select">, "onChange" | "className">;

export type SelectProps = NativeSelectProps & {
	children?: ReactNode;
	className?: ClassValue;
	label?: string;
	onChange?: (value: string) => void;
	status?: ValidationStatus;
	statusMessage?: string;
};

export function Select({
	autoFocus,
	children,
	className,
	defaultValue,
	disabled,
	label,
	name,
	onChange,
	status,
	statusMessage,
	value,
	...rest
}: SelectProps) {
	const id = useId();
	const useWrapper = [label, status, statusMessage].some((v) => v !== undefined && v !== "");

	function handleChange(event: ChangeEvent<HTMLSelectElement>) {
		onChange?.(event.target.value);
	}

	if (useWrapper) {
		return (
			<div className={clsx(styles.wrapper, className)}>
				<select
					{...rest}
					autoFocus={autoFocus}
					className={clsx(styles.select, {
						[styles.statusError]: status === "error",
						[styles.statusWarning]: status === "warning",
						[styles.statusSuccess]: status === "success",
					})}
					defaultValue={defaultValue}
					disabled={disabled}
					id={id}
					name={name}
					onChange={handleChange}
					value={value}
				>
					{label ? <option value="" disabled={true} hidden={true} /> : null}
					{children}
				</select>
				{label ? (
					<label
						className={clsx(styles.label, {
							[styles.floated]: value === undefined ? true : value !== "",
						})}
						htmlFor={id}
					>
						{label}
					</label>
				) : null}
				{statusMessage && status ? (
					<Alert variant={status}>{statusMessage}</Alert>
				) : null}
			</div>
		);
	}

	return (
		<select
			{...rest}
			autoFocus={autoFocus}
			className={clsx(styles.select, className)}
			defaultValue={defaultValue}
			disabled={disabled}
			id={id}
			name={name}
			onChange={handleChange}
			value={value}
		>
			{children}
		</select>
	);
}
```

**Step 4: Update index.ts — remove Input and StatusMessage exports**

```ts
export * from "./Select";
export * from "./TextArea";
```

**Step 5: Delete removed files**

```bash
rm packages/forms/src/Input.tsx packages/forms/src/Input.module.scss
rm packages/forms/src/StatusMessage.tsx packages/forms/src/StatusMessage.module.scss
```

**Step 6: Install and build**

Run: `pnpm install && cd packages/forms && pnpm build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add packages/forms/
git commit -m "refactor(forms): remove Input and StatusMessage, use Alert for validation"
```

---

### Task 6: Add input components to docs — LivePreview scope and sidebar

**Files:**
- Modify: `packages/docs/package.json`
- Modify: `packages/docs/src/components/LivePreview.tsx`
- Modify: `packages/docs/src/data/sidebar.ts`

**Step 1: Add @bezny/input to docs package.json**

In `packages/docs/package.json`, add `"@bezny/input": "workspace:*"` to `dependencies`.

**Step 2: Update LivePreview.tsx**

Add import and scope entries:

```tsx
import { Alert } from "@bezny/alert";
import { Avatar, AvatarStack } from "@bezny/avatar";
import { BreadcrumbItem, Breadcrumbs } from "@bezny/breadcrumbs";
import { Button, Submit } from "@bezny/button";
import { Card, CardBody, CardFooter, CardHeader, CardImg } from "@bezny/card";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@bezny/dialog";
import { Drawer } from "@bezny/drawer";
import { Dropdown } from "@bezny/dropdown";
import {
	DateInput,
	DateTimeInput,
	EmailInput,
	FileInput,
	ImageInput,
	MonthInput,
	NumberInput,
	PasswordInput,
	SearchInput,
	TextInput,
	TimeInput,
	UrlInput,
	WeekInput,
	YearInput,
} from "@bezny/input";
import { Article, Aside, Container, Main, Section, Stack } from "@bezny/layout";
import { Navbar, NavbarBrand, NavbarCollapse, NavbarToggle } from "@bezny/navbar";
import { Overlay } from "@bezny/overlay";
import { ButtonGroup, ButtonGroupOption, Checkbox, CheckboxGroup, Radio, RadioGroup, Switch } from "@bezny/switches";
import { Heading, HeadingLevelProvider, Label, Link, Paragraph, StaticHeading } from "@bezny/text";
import React from "react";
import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";

const scope = {
	Alert: Alert,
	Article: Article,
	Aside: Aside,
	Avatar: Avatar,
	AvatarStack: AvatarStack,
	BreadcrumbItem: BreadcrumbItem,
	Breadcrumbs: Breadcrumbs,
	Button: Button,
	ButtonGroup: ButtonGroup,
	ButtonGroupOption: ButtonGroupOption,
	Card: Card,
	CardBody: CardBody,
	Checkbox: Checkbox,
	CheckboxGroup: CheckboxGroup,
	CardFooter: CardFooter,
	CardHeader: CardHeader,
	CardImg: CardImg,
	Container: Container,
	DateInput: DateInput,
	DateTimeInput: DateTimeInput,
	Dialog: Dialog,
	DialogBody: DialogBody,
	DialogFooter: DialogFooter,
	DialogHeader: DialogHeader,
	Drawer: Drawer,
	Dropdown: Dropdown,
	EmailInput: EmailInput,
	FileInput: FileInput,
	Heading: Heading,
	HeadingLevelProvider: HeadingLevelProvider,
	ImageInput: ImageInput,
	Label: Label,
	Link: Link,
	Main: Main,
	MonthInput: MonthInput,
	Navbar: Navbar,
	NavbarBrand: NavbarBrand,
	NavbarCollapse: NavbarCollapse,
	NavbarToggle: NavbarToggle,
	NumberInput: NumberInput,
	Overlay: Overlay,
	Paragraph: Paragraph,
	PasswordInput: PasswordInput,
	Radio: Radio,
	RadioGroup: RadioGroup,
	React: React,
	SearchInput: SearchInput,
	Section: Section,
	Stack: Stack,
	StaticHeading: StaticHeading,
	Submit: Submit,
	Switch: Switch,
	TextInput: TextInput,
	TimeInput: TimeInput,
	UrlInput: UrlInput,
	WeekInput: WeekInput,
	YearInput: YearInput,
};
```

The rest of the component (LiveCodePreview function) stays unchanged.

**Step 3: Update sidebar.ts**

Add input component entries to the Components group, in alphabetical order:

```ts
import type { SidebarGroup } from "@bezny/navigation";

export const sidebarGroups: SidebarGroup[] = [
	{
		label: "Getting Started",
		items: [{ label: "Introduction", href: "/" }],
	},
	{
		label: "Theming",
		items: [
			{ label: "Overview", href: "/theming/overview/" },
			{ label: "Custom Themes", href: "/theming/custom-themes/" },
			{ label: "Dark Mode", href: "/theming/dark-mode/" },
		],
	},
	{
		label: "Components",
		items: [
			{ label: "Overview", href: "/components/" },
			{ label: "Alert", href: "/components/alert/" },
			{ label: "Avatar", href: "/components/avatar/" },
			{ label: "AvatarStack", href: "/components/avatar-stack/" },
			{ label: "Breadcrumbs", href: "/components/breadcrumbs/" },
			{ label: "Button", href: "/components/button/" },
			{ label: "ButtonGroup", href: "/components/button-group/" },
			{ label: "Card", href: "/components/card/" },
			{ label: "Checkbox", href: "/components/checkbox/" },
			{ label: "Container", href: "/components/container/" },
			{ label: "DateInput", href: "/components/date-input/" },
			{ label: "DateTimeInput", href: "/components/date-time-input/" },
			{ label: "Dialog", href: "/components/dialog/" },
			{ label: "Drawer", href: "/components/drawer/" },
			{ label: "Dropdown", href: "/components/dropdown/" },
			{ label: "EmailInput", href: "/components/email-input/" },
			{ label: "FileInput", href: "/components/file-input/" },
			{ label: "Heading", href: "/components/heading/" },
			{ label: "ImageInput", href: "/components/image-input/" },
			{ label: "Label", href: "/components/label/" },
			{ label: "Link", href: "/components/link/" },
			{ label: "MonthInput", href: "/components/month-input/" },
			{ label: "Navbar", href: "/components/navbar/" },
			{ label: "NumberInput", href: "/components/number-input/" },
			{ label: "Overlay", href: "/components/overlay/" },
			{ label: "Paragraph", href: "/components/paragraph/" },
			{ label: "PasswordInput", href: "/components/password-input/" },
			{ label: "Radio", href: "/components/radio/" },
			{ label: "SearchInput", href: "/components/search-input/" },
			{ label: "Semantic Elements", href: "/components/semantic-elements/" },
			{ label: "Stack", href: "/components/stack/" },
			{ label: "Switch", href: "/components/switch/" },
			{ label: "TextInput", href: "/components/text-input/" },
			{ label: "TimeInput", href: "/components/time-input/" },
			{ label: "UrlInput", href: "/components/url-input/" },
			{ label: "WeekInput", href: "/components/week-input/" },
			{ label: "YearInput", href: "/components/year-input/" },
		],
	},
];
```

**Step 4: Install**

Run: `pnpm install`

**Step 5: Commit**

```bash
git add packages/docs/package.json packages/docs/src/components/LivePreview.tsx packages/docs/src/data/sidebar.ts
git commit -m "feat(docs): add input components to LivePreview scope and sidebar"
```

---

### Task 7: Create docs pages for keyboard-typeable inputs

**Files:**
- Create: `packages/docs/src/content/docs/components/text-input.mdx`
- Create: `packages/docs/src/content/docs/components/number-input.mdx`
- Create: `packages/docs/src/content/docs/components/date-input.mdx`
- Create: `packages/docs/src/content/docs/components/date-time-input.mdx`
- Create: `packages/docs/src/content/docs/components/time-input.mdx`
- Create: `packages/docs/src/content/docs/components/email-input.mdx`
- Create: `packages/docs/src/content/docs/components/month-input.mdx`
- Create: `packages/docs/src/content/docs/components/year-input.mdx`
- Create: `packages/docs/src/content/docs/components/password-input.mdx`
- Create: `packages/docs/src/content/docs/components/search-input.mdx`
- Create: `packages/docs/src/content/docs/components/url-input.mdx`
- Create: `packages/docs/src/content/docs/components/week-input.mdx`

Each doc page follows this template (example for TextInput shown, adapt per component):

**Step 1: Create text-input.mdx**

```mdx
---
title: TextInput
---

import LivePreview from "../../../components/LivePreview";

A text input with floating label support and validation.

\`\`\`tsx
import { TextInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<TextInput label="Username" />`} />

### Disabled

<LivePreview client:load code={`<TextInput label="Username" disabled />`} />

### With Placeholder

<LivePreview client:load code={`<TextInput placeholder="Enter your name" />`} />

### Controlled

<LivePreview client:load noInline code={`function ControlledExample() {
  const [value, setValue] = React.useState("");
  return (
    <TextInput
      label="Name"
      value={value}
      onChange={setValue}
    />
  );
}

render(<ControlledExample />);`} />

### Validation

<LivePreview client:load code={`<TextInput label="Email" status="error" statusMessage="This field is required" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `defaultValue` | `string` | — | Initial value (uncontrolled) |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Floating label text |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(value: string) => void` | — | Called with the input value |
| `placeholder` | `string` | — | Placeholder text |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
| `value` | `string` | — | Controlled value |
```

**Step 2: Create number-input.mdx**

```mdx
---
title: NumberInput
---

import LivePreview from "../../../components/LivePreview";

A number input with floating label support and validation.

\`\`\`tsx
import { NumberInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<NumberInput label="Quantity" />`} />

### With Min and Max

<LivePreview client:load code={`<NumberInput label="Age" min={0} max={150} />`} />

### With Step

<LivePreview client:load code={`<NumberInput label="Price" step={0.01} />`} />

### Validation

<LivePreview client:load code={`<NumberInput label="Amount" status="error" statusMessage="Must be positive" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `defaultValue` | `string` | — | Initial value (uncontrolled) |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Floating label text |
| `max` | `number` | — | Maximum value |
| `min` | `number` | — | Minimum value |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(value: string) => void` | — | Called with the input value |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
| `step` | `number` | — | Step increment |
| `value` | `string` | — | Controlled value |
```

**Step 3: Create date-input.mdx**

```mdx
---
title: DateInput
---

import LivePreview from "../../../components/LivePreview";

A date picker input with floating label support and validation.

\`\`\`tsx
import { DateInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<DateInput label="Birthday" />`} />

### With Constraints

<LivePreview client:load code={`<DateInput label="Departure" min="2026-01-01" max="2026-12-31" />`} />

### Validation

<LivePreview client:load code={`<DateInput label="Start date" status="warning" statusMessage="Date is in the past" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `defaultValue` | `string` | — | Initial value (uncontrolled) |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Floating label text |
| `max` | `string` | — | Latest allowed date |
| `min` | `string` | — | Earliest allowed date |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(value: string) => void` | — | Called with the input value |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
| `value` | `string` | — | Controlled value |
```

**Step 4: Create date-time-input.mdx**

```mdx
---
title: DateTimeInput
---

import LivePreview from "../../../components/LivePreview";

A datetime-local input with floating label support and validation.

\`\`\`tsx
import { DateTimeInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<DateTimeInput label="Meeting start" />`} />

### Validation

<LivePreview client:load code={`<DateTimeInput label="Deadline" status="error" statusMessage="Must be in the future" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `defaultValue` | `string` | — | Initial value (uncontrolled) |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Floating label text |
| `max` | `string` | — | Latest allowed datetime |
| `min` | `string` | — | Earliest allowed datetime |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(value: string) => void` | — | Called with the input value |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
| `value` | `string` | — | Controlled value |
```

**Step 5: Create time-input.mdx**

```mdx
---
title: TimeInput
---

import LivePreview from "../../../components/LivePreview";

A time input with floating label support and validation.

\`\`\`tsx
import { TimeInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<TimeInput label="Start time" />`} />

### With Step

<LivePreview client:load code={`<TimeInput label="Alarm" step={60} />`} />

### Validation

<LivePreview client:load code={`<TimeInput label="Check-in" status="success" statusMessage="Time confirmed" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `defaultValue` | `string` | — | Initial value (uncontrolled) |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Floating label text |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(value: string) => void` | — | Called with the input value |
| `step` | `number` | — | Step in seconds |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
| `value` | `string` | — | Controlled value |
```

**Step 6: Create email-input.mdx**

```mdx
---
title: EmailInput
---

import LivePreview from "../../../components/LivePreview";

An email input with floating label support and validation.

\`\`\`tsx
import { EmailInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<EmailInput label="Email address" />`} />

### Validation

<LivePreview client:load code={`<EmailInput label="Email" status="error" statusMessage="Invalid email format" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `defaultValue` | `string` | — | Initial value (uncontrolled) |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Floating label text |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(value: string) => void` | — | Called with the input value |
| `placeholder` | `string` | — | Placeholder text |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
| `value` | `string` | — | Controlled value |
```

**Step 7: Create month-input.mdx**

```mdx
---
title: MonthInput
---

import LivePreview from "../../../components/LivePreview";

A month picker input with floating label support and validation.

\`\`\`tsx
import { MonthInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<MonthInput label="Birth month" />`} />

### With Constraints

<LivePreview client:load code={`<MonthInput label="Billing month" min="2026-01" max="2026-12" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `defaultValue` | `string` | — | Initial value (uncontrolled) |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Floating label text |
| `max` | `string` | — | Latest allowed month |
| `min` | `string` | — | Earliest allowed month |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(value: string) => void` | — | Called with the input value |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
| `value` | `string` | — | Controlled value |
```

**Step 8: Create year-input.mdx**

```mdx
---
title: YearInput
---

import LivePreview from "../../../components/LivePreview";

A year input (numeric with year-appropriate defaults) with floating label support and validation.

\`\`\`tsx
import { YearInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<YearInput label="Year of birth" />`} />

### Custom Range

<LivePreview client:load code={`<YearInput label="Graduation year" min={2000} max={2030} />`} />

### Validation

<LivePreview client:load code={`<YearInput label="Year" status="error" statusMessage="Year out of range" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `defaultValue` | `string` | — | Initial value (uncontrolled) |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Floating label text |
| `max` | `number` | `2100` | Maximum year |
| `min` | `number` | `1900` | Minimum year |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(value: string) => void` | — | Called with the input value |
| `step` | `number` | `1` | Step increment |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
| `value` | `string` | — | Controlled value |
```

**Step 9: Create password-input.mdx**

```mdx
---
title: PasswordInput
---

import LivePreview from "../../../components/LivePreview";

A password input with floating label support and validation.

\`\`\`tsx
import { PasswordInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<PasswordInput label="Password" />`} />

### Validation

<LivePreview client:load code={`<PasswordInput label="Password" status="error" statusMessage="Must be at least 8 characters" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `defaultValue` | `string` | — | Initial value (uncontrolled) |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Floating label text |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(value: string) => void` | — | Called with the input value |
| `placeholder` | `string` | — | Placeholder text |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
| `value` | `string` | — | Controlled value |
```

**Step 10: Create search-input.mdx**

```mdx
---
title: SearchInput
---

import LivePreview from "../../../components/LivePreview";

A search input with floating label support and validation.

\`\`\`tsx
import { SearchInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<SearchInput label="Search" />`} />

### With Placeholder

<LivePreview client:load code={`<SearchInput placeholder="Search products..." />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `defaultValue` | `string` | — | Initial value (uncontrolled) |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Floating label text |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(value: string) => void` | — | Called with the input value |
| `placeholder` | `string` | — | Placeholder text |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
| `value` | `string` | — | Controlled value |
```

**Step 11: Create url-input.mdx**

```mdx
---
title: UrlInput
---

import LivePreview from "../../../components/LivePreview";

A URL input with floating label support and validation.

\`\`\`tsx
import { UrlInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<UrlInput label="Website" />`} />

### Validation

<LivePreview client:load code={`<UrlInput label="Homepage" status="error" statusMessage="Must be a valid URL" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `defaultValue` | `string` | — | Initial value (uncontrolled) |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Floating label text |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(value: string) => void` | — | Called with the input value |
| `placeholder` | `string` | — | Placeholder text |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
| `value` | `string` | — | Controlled value |
```

**Step 12: Create week-input.mdx**

```mdx
---
title: WeekInput
---

import LivePreview from "../../../components/LivePreview";

A week picker input with floating label support and validation.

\`\`\`tsx
import { WeekInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<WeekInput label="Week" />`} />

### With Constraints

<LivePreview client:load code={`<WeekInput label="Sprint" min="2026-W01" max="2026-W52" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `ClassValue` | — | Additional CSS classes |
| `defaultValue` | `string` | — | Initial value (uncontrolled) |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Floating label text |
| `max` | `string` | — | Latest allowed week |
| `min` | `string` | — | Earliest allowed week |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(value: string) => void` | — | Called with the input value |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
| `value` | `string` | — | Controlled value |
```

**Step 13: Commit**

```bash
git add packages/docs/src/content/docs/components/
git commit -m "docs(input): add documentation pages for keyboard-typeable inputs"
```

---

### Task 8: Create docs pages for FileInput and ImageInput

**Files:**
- Create: `packages/docs/src/content/docs/components/file-input.mdx`
- Create: `packages/docs/src/content/docs/components/image-input.mdx`

**Step 1: Create file-input.mdx**

```mdx
---
title: FileInput
---

import LivePreview from "../../../components/LivePreview";

A file input with label support and validation.

\`\`\`tsx
import { FileInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<FileInput label="Upload file" />`} />

### With Accept

<LivePreview client:load code={`<FileInput label="Document" accept=".pdf,.doc,.docx" />`} />

### Multiple Files

<LivePreview client:load code={`<FileInput label="Attachments" multiple />`} />

### Validation

<LivePreview client:load code={`<FileInput label="Resume" status="error" statusMessage="File is too large" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accept` | `string` | — | Accepted file types |
| `className` | `ClassValue` | — | Additional CSS classes |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Label text |
| `multiple` | `boolean` | — | Allow multiple files |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(files: FileList \| null) => void` | — | Called with the selected files |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
```

**Step 2: Create image-input.mdx**

```mdx
---
title: ImageInput
---

import LivePreview from "../../../components/LivePreview";

A file input pre-configured for images with label support and validation.

\`\`\`tsx
import { ImageInput } from "@bezny/input";
\`\`\`

## Examples

### Basic

<LivePreview client:load code={`<ImageInput label="Profile photo" />`} />

### Custom Accept

<LivePreview client:load code={`<ImageInput label="Logo" accept="image/png,image/svg+xml" />`} />

### Multiple

<LivePreview client:load code={`<ImageInput label="Gallery images" multiple />`} />

### Validation

<LivePreview client:load code={`<ImageInput label="Avatar" status="error" statusMessage="Image must be under 5MB" />`} />

## API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accept` | `string` | `"image/*"` | Accepted file types |
| `className` | `ClassValue` | — | Additional CSS classes |
| `disabled` | `boolean` | — | Disables the input |
| `label` | `string` | — | Label text |
| `multiple` | `boolean` | — | Allow multiple files |
| `name` | `string` | — | HTML name attribute |
| `onChange` | `(files: FileList \| null) => void` | — | Called with the selected files |
| `status` | `"error" \| "warning" \| "success"` | — | Validation status |
| `statusMessage` | `string` | — | Validation message shown as Alert |
```

**Step 3: Commit**

```bash
git add packages/docs/src/content/docs/components/file-input.mdx packages/docs/src/content/docs/components/image-input.mdx
git commit -m "docs(input): add FileInput and ImageInput documentation pages"
```

---

### Task 9: Final verification

**Step 1: Full build**

Run: `pnpm build`
Expected: All packages build successfully

**Step 2: All tests pass**

Run: `pnpm test`
Expected: All tests pass

**Step 3: Lint**

Run: `pnpm lint`
Expected: No lint errors

**Step 4: Start docs dev server and spot-check**

Run: `cd packages/docs && pnpm start`
Spot-check: Navigate to `/components/text-input/`, `/components/file-input/`, `/components/year-input/` — verify live previews render correctly.

**Step 5: Commit any fixes if needed**
