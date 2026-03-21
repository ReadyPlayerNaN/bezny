import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";
import { CheckboxGroup } from "./CheckboxGroup";

describe("Checkbox", () => {
	it("renders a checkbox input", () => {
		render(<Checkbox label="Accept" />);
		expect(screen.getByRole("checkbox", { name: "Accept" })).toBeInTheDocument();
	});

	it("calls onChange when clicked", async () => {
		const onChange = vi.fn();
		render(<Checkbox label="Accept" onChange={onChange} />);
		await userEvent.click(screen.getByRole("checkbox", { name: "Accept" }));
		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange.mock.calls[0][0].target.checked).toBe(true);
	});

	it("reflects controlled checked state", () => {
		render(<Checkbox label="Accept" checked={true} onChange={() => undefined} />);
		expect(screen.getByRole("checkbox", { name: "Accept" })).toBeChecked();
	});

	it("sets indeterminate on the input element", () => {
		render(<Checkbox label="Partial" indeterminate={true} />);
		const input = screen.getByRole("checkbox", { name: "Partial" }) as HTMLInputElement;
		expect(input.indeterminate).toBe(true);
	});

	it("clears indeterminate when prop changes to false", () => {
		const { rerender } = render(<Checkbox label="Partial" indeterminate={true} />);
		rerender(<Checkbox label="Partial" indeterminate={false} />);
		const input = screen.getByRole("checkbox", { name: "Partial" }) as HTMLInputElement;
		expect(input.indeterminate).toBe(false);
	});

	it("renders as disabled", () => {
		render(<Checkbox label="Disabled" disabled={true} />);
		expect(screen.getByRole("checkbox", { name: "Disabled" })).toBeDisabled();
	});
});

describe("CheckboxGroup", () => {
	it("checks checkboxes whose values are in the group value", () => {
		render(
			<CheckboxGroup value={["a", "c"]} onChange={() => undefined}>
				<Checkbox label="Alpha" value="a" />
				<Checkbox label="Beta" value="b" />
				<Checkbox label="Gamma" value="c" />
			</CheckboxGroup>,
		);
		expect(screen.getByRole("checkbox", { name: "Alpha" })).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Beta" })).not.toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Gamma" })).toBeChecked();
	});

	it("calls onChange with added value when unchecked item is clicked", async () => {
		const onChange = vi.fn();
		render(
			<CheckboxGroup value={["a"]} onChange={onChange}>
				<Checkbox label="Alpha" value="a" />
				<Checkbox label="Beta" value="b" />
			</CheckboxGroup>,
		);
		await userEvent.click(screen.getByRole("checkbox", { name: "Beta" }));
		expect(onChange).toHaveBeenCalledWith(["a", "b"]);
	});

	it("calls onChange with removed value when checked item is clicked", async () => {
		const onChange = vi.fn();
		render(
			<CheckboxGroup value={["a", "b"]} onChange={onChange}>
				<Checkbox label="Alpha" value="a" />
				<Checkbox label="Beta" value="b" />
			</CheckboxGroup>,
		);
		await userEvent.click(screen.getByRole("checkbox", { name: "Beta" }));
		expect(onChange).toHaveBeenCalledWith(["a"]);
	});

	it("disables all checkboxes when group is disabled", () => {
		render(
			<CheckboxGroup value={[]} disabled={true}>
				<Checkbox label="Alpha" value="a" />
				<Checkbox label="Beta" value="b" />
			</CheckboxGroup>,
		);
		expect(screen.getByRole("checkbox", { name: "Alpha" })).toBeDisabled();
		expect(screen.getByRole("checkbox", { name: "Beta" })).toBeDisabled();
	});

	it("renders a legend when provided", () => {
		render(
			<CheckboxGroup value={[]} legend="Options">
				<Checkbox label="Alpha" value="a" />
			</CheckboxGroup>,
		);
		expect(screen.getByText("Options")).toBeInTheDocument();
	});
});
