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
