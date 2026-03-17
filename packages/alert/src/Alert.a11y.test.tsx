import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Alert } from "./Alert";

describe("Alert a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<Alert variant="success">Operation completed</Alert>);
		expect(await axe(container)).toHaveNoViolations();
	});
});
