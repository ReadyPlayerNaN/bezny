import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Radio } from "./Radio";
import { RadioGroup } from "./RadioGroup";

describe("Radio", () => {
	it("renders a radio input", () => {
		render(<Radio label="Option A" name="test" />);
		expect(screen.getByRole("radio", { name: "Option A" })).toBeInTheDocument();
	});

	it("calls onChange when clicked", async () => {
		const onChange = vi.fn();
		render(<Radio label="Option A" name="test" onChange={onChange} />);
		await userEvent.click(screen.getByRole("radio", { name: "Option A" }));
		expect(onChange).toHaveBeenCalledOnce();
	});

	it("reflects controlled checked state", () => {
		render(<Radio label="Option A" checked={true} onChange={() => undefined} />);
		expect(screen.getByRole("radio", { name: "Option A" })).toBeChecked();
	});

	it("renders as disabled", () => {
		render(<Radio label="Option A" disabled={true} />);
		expect(screen.getByRole("radio", { name: "Option A" })).toBeDisabled();
	});
});

describe("RadioGroup", () => {
	it("checks the radio whose value matches the group value", () => {
		render(
			<RadioGroup value="b" onChange={() => undefined}>
				<Radio label="Alpha" value="a" />
				<Radio label="Beta" value="b" />
			</RadioGroup>,
		);
		expect(screen.getByRole("radio", { name: "Alpha" })).not.toBeChecked();
		expect(screen.getByRole("radio", { name: "Beta" })).toBeChecked();
	});

	it("calls onChange with the clicked value", async () => {
		const onChange = vi.fn();
		render(
			<RadioGroup value="a" onChange={onChange}>
				<Radio label="Alpha" value="a" />
				<Radio label="Beta" value="b" />
			</RadioGroup>,
		);
		await userEvent.click(screen.getByRole("radio", { name: "Beta" }));
		expect(onChange).toHaveBeenCalledWith("b");
	});

	it("propagates the group name to all radios", () => {
		render(
			<RadioGroup value="a" name="color" onChange={() => undefined}>
				<Radio label="Red" value="red" />
				<Radio label="Blue" value="blue" />
			</RadioGroup>,
		);
		expect(screen.getByRole("radio", { name: "Red" })).toHaveAttribute("name", "color");
		expect(screen.getByRole("radio", { name: "Blue" })).toHaveAttribute("name", "color");
	});

	it("disables all radios when group is disabled", () => {
		render(
			<RadioGroup value="a" disabled={true}>
				<Radio label="Alpha" value="a" />
				<Radio label="Beta" value="b" />
			</RadioGroup>,
		);
		expect(screen.getByRole("radio", { name: "Alpha" })).toBeDisabled();
		expect(screen.getByRole("radio", { name: "Beta" })).toBeDisabled();
	});

	it("renders a legend when provided", () => {
		render(
			<RadioGroup value="a" legend="Pick one">
				<Radio label="Alpha" value="a" />
			</RadioGroup>,
		);
		expect(screen.getByText("Pick one")).toBeInTheDocument();
	});
});
