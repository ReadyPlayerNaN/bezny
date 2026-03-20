import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type RefObject, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Popover, type PopoverProps } from "./Popover";

afterEach(cleanup);

function TestPopover(props: Partial<PopoverProps> & { anchorLabel?: string }) {
	const { anchorLabel = "Anchor", ...rest } = props;
	const ref = useRef<HTMLButtonElement>(null);
	return (
		<>
			<button ref={ref} type="button">
				{anchorLabel}
			</button>
			<Popover anchorRef={ref as RefObject<HTMLElement>} open={false} onClose={() => undefined} {...rest} />
		</>
	);
}

describe("Popover", () => {
	it("renders nothing when closed", () => {
		render(<TestPopover />);
		expect(screen.queryByText("content")).not.toBeInTheDocument();
	});

	it("renders children when open", () => {
		render(
			<TestPopover open={true}>
				<span>Popover content</span>
			</TestPopover>,
		);
		expect(screen.getByText("Popover content")).toBeInTheDocument();
	});

	it("calls onClose when Escape is pressed", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<TestPopover open={true} onClose={onClose}>
				<span>content</span>
			</TestPopover>,
		);
		await user.keyboard("{Escape}");
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("does not call onClose on Escape when closed", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<TestPopover open={false} onClose={onClose}>
				<span>content</span>
			</TestPopover>,
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
				<TestPopover open={true} onClose={onClose}>
					<span>content</span>
				</TestPopover>
			</>,
		);
		await user.click(screen.getByText("Outside"));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("does not call onClose when clicking inside popover", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<TestPopover open={true} onClose={onClose}>
				<button type="button">Inside</button>
			</TestPopover>,
		);
		await user.click(screen.getByText("Inside"));
		expect(onClose).not.toHaveBeenCalled();
	});

	it("does not call onClose when clicking anchor", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<TestPopover open={true} onClose={onClose}>
				<span>content</span>
			</TestPopover>,
		);
		await user.click(screen.getByText("Anchor"));
		expect(onClose).not.toHaveBeenCalled();
	});

	it("renders into a portal on document.body", () => {
		render(
			<div data-testid="parent">
				<TestPopover open={true}>
					<span data-testid="popover-child">content</span>
				</TestPopover>
			</div>,
		);
		const parent = screen.getByTestId("parent");
		const child = screen.getByTestId("popover-child");
		expect(parent.contains(child)).toBe(false);
		expect(document.body.contains(child)).toBe(true);
	});
});
