import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type RefObject, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dropdown, type DropdownProps } from "./Dropdown";

afterEach(cleanup);

function TestDropdown(props: Partial<DropdownProps> & { anchorLabel?: string }) {
	const { anchorLabel = "Toggle", ...rest } = props;
	const ref = useRef<HTMLButtonElement>(null);
	return (
		<>
			<button ref={ref} type="button">
				{anchorLabel}
			</button>
			<Dropdown anchorRef={ref as RefObject<HTMLElement>} open={false} onClose={() => undefined} {...rest} />
		</>
	);
}

describe("Dropdown", () => {
	it("renders nothing when closed", () => {
		render(<TestDropdown />);
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});

	it("renders children with menu role when open", () => {
		render(
			<TestDropdown open={true}>
				<button type="button" role="menuitem">
					Option 1
				</button>
			</TestDropdown>,
		);
		expect(screen.getByRole("menu")).toBeInTheDocument();
		expect(screen.getByText("Option 1")).toBeInTheDocument();
	});

	it("calls onClose when Escape is pressed", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<TestDropdown open={true} onClose={onClose}>
				<button type="button" role="menuitem">
					Option
				</button>
			</TestDropdown>,
		);
		await user.keyboard("{Escape}");
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("does not call onClose on Escape when closed", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<TestDropdown open={false} onClose={onClose}>
				<button type="button" role="menuitem">
					Option
				</button>
			</TestDropdown>,
		);
		await user.keyboard("{Escape}");
		expect(onClose).not.toHaveBeenCalled();
	});

	it("calls onClose when clicking outside", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<>
				<button type="button">Outside</button>
				<TestDropdown open={true} onClose={onClose}>
					<button type="button" role="menuitem">
						Option
					</button>
				</TestDropdown>
			</>,
		);
		await user.click(screen.getByText("Outside"));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("does not call onClose when clicking inside dropdown", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<TestDropdown open={true} onClose={onClose}>
				<button type="button" role="menuitem">
					Option
				</button>
			</TestDropdown>,
		);
		await user.click(screen.getByText("Option"));
		expect(onClose).not.toHaveBeenCalled();
	});

	it("does not call onClose when clicking anchor", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<TestDropdown open={true} onClose={onClose}>
				<button type="button" role="menuitem">
					Option
				</button>
			</TestDropdown>,
		);
		await user.click(screen.getByText("Toggle"));
		expect(onClose).not.toHaveBeenCalled();
	});

	it("focuses first focusable element when opened", () => {
		render(
			<TestDropdown open={true}>
				<button type="button" role="menuitem">
					First
				</button>
				<button type="button" role="menuitem">
					Second
				</button>
			</TestDropdown>,
		);
		expect(document.activeElement).toBe(screen.getByText("First"));
	});

	it("renders into a portal on document.body", () => {
		render(
			<div data-testid="parent">
				<TestDropdown open={true}>
					<span data-testid="dropdown-child">content</span>
				</TestDropdown>
			</div>,
		);
		const parent = screen.getByTestId("parent");
		const child = screen.getByTestId("dropdown-child");
		expect(parent.contains(child)).toBe(false);
		expect(document.body.contains(child)).toBe(true);
	});
});
