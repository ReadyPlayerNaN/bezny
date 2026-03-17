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
			<ButtonGroup value="a" disabled={true}>
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
