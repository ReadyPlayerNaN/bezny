import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Drawer } from "./Drawer";

afterEach(cleanup);

const noop = () => undefined;

describe("Drawer", () => {
	it("renders children when open", () => {
		render(
			<Drawer open={true} onClose={noop}>
				<span>Drawer content</span>
			</Drawer>,
		);
		expect(screen.getByText("Drawer content")).toBeInTheDocument();
	});

	it("renders as dialog with aria-modal", () => {
		render(
			<Drawer open={true} onClose={noop} aria-label="Settings">
				<span>content</span>
			</Drawer>,
		);
		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(dialog).toHaveAttribute("aria-label", "Settings");
	});

	it("renders a close button", () => {
		render(
			<Drawer open={true} onClose={noop}>
				<span>content</span>
			</Drawer>,
		);
		expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
	});

	it("calls onClose when close button is clicked", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<Drawer open={true} onClose={onClose}>
				<span>content</span>
			</Drawer>,
		);
		await user.click(screen.getByRole("button", { name: "Close" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when Escape is pressed", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<Drawer open={true} onClose={onClose}>
				<span>content</span>
			</Drawer>,
		);
		await user.keyboard("{Escape}");
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("does not call onClose on Escape when closed", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<Drawer open={false} onClose={onClose}>
				<span>content</span>
			</Drawer>,
		);
		await user.keyboard("{Escape}");
		expect(onClose).not.toHaveBeenCalled();
	});

	it("contains focusable elements for focus trapping", () => {
		render(
			<Drawer open={true} onClose={noop}>
				<input data-testid="first-input" />
				<button type="button">Action</button>
			</Drawer>,
		);
		// Close button + input + Action button are all focusable within the dialog
		const dialog = screen.getByRole("dialog");
		const focusable = dialog.querySelectorAll("button:not([disabled]), input:not([disabled])");
		expect(focusable.length).toBeGreaterThanOrEqual(3);
	});

	it("calls onClose when clicking outside the panel", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<Drawer open={true} onClose={onClose}>
				<span>content</span>
			</Drawer>,
		);
		await user.click(document.body);
		expect(onClose).toHaveBeenCalled();
	});

	it("does not call onClose when clicking inside the panel", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<Drawer open={true} onClose={onClose}>
				<span>Inside content</span>
			</Drawer>,
		);
		await user.click(screen.getByText("Inside content"));
		expect(onClose).not.toHaveBeenCalled();
	});
});
