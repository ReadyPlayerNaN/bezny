import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { TextInput } from "./TextInput";

describe("TextInput a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<TextInput label="Name" />);
		expect(await axe(container)).toHaveNoViolations();
	});
});
