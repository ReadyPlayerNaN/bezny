import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { StatusMessage } from "./StatusMessage";

describe("StatusMessage a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<StatusMessage message="Something went wrong" status="error" />);
		expect(await axe(container)).toHaveNoViolations();
	});
});
