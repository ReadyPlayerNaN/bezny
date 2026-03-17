import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Container } from "./Container";
import { Stack } from "./Stack";

describe("Container a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<Container>Content</Container>);
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Stack a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(
			<Stack>
				<div>Item 1</div>
				<div>Item 2</div>
			</Stack>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
