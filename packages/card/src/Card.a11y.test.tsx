import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Card } from "./Card";

describe("Card a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(
			<Card>
				<Card.Header>Title</Card.Header>
				<Card.Body>Content</Card.Body>
			</Card>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
