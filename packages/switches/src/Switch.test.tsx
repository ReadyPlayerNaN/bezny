import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./Switch";

describe("Switch", () => {
	it("renders a checkbox input with a label", () => {
		render(<Switch label="Dark mode" />);
		expect(screen.getByRole("checkbox", { name: "Dark mode" })).toBeInTheDocument();
	});

	it("reflects controlled checked state", () => {
		render(<Switch label="Dark mode" checked={true} onChange={() => undefined} />);
		expect(screen.getByRole("checkbox", { name: "Dark mode" })).toBeChecked();
	});

	it("reflects controlled unchecked state", () => {
		render(<Switch label="Dark mode" checked={false} onChange={() => undefined} />);
		expect(screen.getByRole("checkbox", { name: "Dark mode" })).not.toBeChecked();
	});

	it("calls onChange when toggled", async () => {
		const onChange = vi.fn();
		render(<Switch label="Dark mode" checked={false} onChange={onChange} />);
		await userEvent.click(screen.getByRole("checkbox", { name: "Dark mode" }));
		expect(onChange).toHaveBeenCalledOnce();
	});

	it("renders as disabled", () => {
		render(<Switch label="Dark mode" disabled={true} />);
		expect(screen.getByRole("checkbox", { name: "Dark mode" })).toBeDisabled();
	});

	it("does not call onChange when disabled", async () => {
		const onChange = vi.fn();
		render(<Switch label="Dark mode" disabled={true} onChange={onChange} />);
		await userEvent.click(screen.getByRole("checkbox", { name: "Dark mode" }));
		expect(onChange).not.toHaveBeenCalled();
	});
});
