import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "./Button";

describe("Button a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<Button>Click me</Button>);
		expect(await axe(container)).toHaveNoViolations();
	});
});
