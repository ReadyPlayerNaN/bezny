import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Checkbox } from "./Checkbox";
import { Switch } from "./Switch";

describe("Checkbox a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<Checkbox label="Agree to terms" />);
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Switch a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<Switch label="Enable notifications" />);
		expect(await axe(container)).toHaveNoViolations();
	});
});
