import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Select } from "./Select";
import { TextArea } from "./TextArea";

describe("TextArea a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<TextArea label="Description" />);
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Select a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(
			<Select label="Country">
				<option value="us">United States</option>
				<option value="uk">United Kingdom</option>
			</Select>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
