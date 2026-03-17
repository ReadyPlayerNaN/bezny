import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Avatar } from "./Avatar";

describe("Avatar a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<Avatar name="John Doe" email="john@example.com" />);
		expect(await axe(container)).toHaveNoViolations();
	});
});
