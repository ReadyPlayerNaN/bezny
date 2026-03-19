import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TagListInput } from "./TagListInput";

afterEach(cleanup);

const defaultTags = [
	{ label: "React", value: "react" },
	{ label: "TypeScript", value: "typescript" },
];

describe("TagListInput", () => {
	it("renders label linked to input", () => {
		render(<TagListInput label="Skills" onChange={vi.fn()} values={[]} />);
		expect(screen.getByLabelText("Skills")).toBeInTheDocument();
	});

	it("renders existing tags as chips", () => {
		render(<TagListInput label="Skills" onChange={vi.fn()} values={defaultTags} />);
		expect(screen.getByText("React")).toBeInTheDocument();
		expect(screen.getByText("TypeScript")).toBeInTheDocument();
	});

	it("adds tag on Enter keypress and clears input", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TagListInput label="Skills" onChange={onChange} values={[]} />);
		const input = screen.getByLabelText("Skills");
		await user.type(input, "vue{Enter}");
		expect(onChange).toHaveBeenCalledWith([{ label: "vue", value: "vue" }]);
	});

	it("adds tag on Add button click and clears input", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TagListInput label="Skills" onChange={onChange} values={[]} />);
		const input = screen.getByLabelText("Skills");
		await user.type(input, "vue");
		await user.click(screen.getByText("Add"));
		expect(onChange).toHaveBeenCalledWith([{ label: "vue", value: "vue" }]);
	});

	it("trims whitespace from input", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TagListInput label="Skills" onChange={onChange} values={[]} />);
		await user.type(screen.getByLabelText("Skills"), "  vue  {Enter}");
		expect(onChange).toHaveBeenCalledWith([{ label: "vue", value: "vue" }]);
	});

	it("rejects duplicate values", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TagListInput label="Skills" onChange={onChange} values={defaultTags} />);
		await user.type(screen.getByLabelText("Skills"), "react{Enter}");
		expect(onChange).not.toHaveBeenCalled();
	});

	it("does not add empty input", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TagListInput label="Skills" onChange={onChange} values={[]} />);
		await user.type(screen.getByLabelText("Skills"), "{Enter}");
		expect(onChange).not.toHaveBeenCalled();
	});

	it("removes tag on × button click", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TagListInput label="Skills" onChange={onChange} values={defaultTags} />);
		await user.click(screen.getByLabelText("Remove React"));
		expect(onChange).toHaveBeenCalledWith([{ label: "TypeScript", value: "typescript" }]);
	});

	it("has correct aria-label on remove buttons", () => {
		render(<TagListInput label="Skills" onChange={vi.fn()} values={defaultTags} />);
		expect(screen.getByLabelText("Remove React")).toBeInTheDocument();
		expect(screen.getByLabelText("Remove TypeScript")).toBeInTheDocument();
	});

	it("renders validation alert", () => {
		render(
			<TagListInput
				label="Skills"
				onChange={vi.fn()}
				status="error"
				statusMessage="At least one skill required"
				values={[]}
			/>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent("At least one skill required");
	});

	it("disables input and Add button when disabled", () => {
		render(<TagListInput disabled={true} label="Skills" onChange={vi.fn()} values={defaultTags} />);
		expect(screen.getByLabelText("Skills")).toBeDisabled();
		expect(screen.getByText("Add")).toBeDisabled();
	});
});
