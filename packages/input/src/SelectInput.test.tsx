import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SelectInput } from "./SelectInput";

const options = [
	{ label: "Apple", value: "apple" },
	{ label: "Banana", value: "banana" },
	{ label: "Cherry", value: "cherry" },
];

describe("SelectInput", () => {
	it("renders a select with options", () => {
		render(<SelectInput options={options} />);
		const select = screen.getByRole("combobox");
		expect(select).toBeInTheDocument();
		expect(screen.getByText("Apple")).toBeInTheDocument();
		expect(screen.getByText("Banana")).toBeInTheDocument();
		expect(screen.getByText("Cherry")).toBeInTheDocument();
	});

	it("renders with a label", () => {
		render(<SelectInput label="Fruit" options={options} />);
		expect(screen.getByLabelText("Fruit")).toBeInTheDocument();
	});

	it("calls onChange with selected value", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<SelectInput label="Fruit" onChange={onChange} options={options} />);
		await user.selectOptions(screen.getByLabelText("Fruit"), "banana");
		expect(onChange).toHaveBeenCalledWith("banana");
	});

	it("renders validation alert when status and statusMessage are set", () => {
		render(<SelectInput label="Fruit" options={options} status="error" statusMessage="Required" />);
		expect(screen.getByRole("alert")).toHaveTextContent("Required");
	});

	it("renders a placeholder option", () => {
		render(<SelectInput options={options} placeholder="Pick a fruit" />);
		expect(screen.getByText("Pick a fruit")).toBeInTheDocument();
	});

	it("disables the select when disabled", () => {
		render(<SelectInput disabled={true} options={options} />);
		expect(screen.getByRole("combobox")).toBeDisabled();
	});
});
