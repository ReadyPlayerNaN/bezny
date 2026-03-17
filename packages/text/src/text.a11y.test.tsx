import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Heading } from "./Heading";
import { Link } from "./Link";
import { Paragraph } from "./Paragraph";

describe("Heading a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<Heading level={1}>Page title</Heading>);
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Paragraph a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<Paragraph>Some text content</Paragraph>);
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Link a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<Link href="https://example.com">Example</Link>);
		expect(await axe(container)).toHaveNoViolations();
	});
});
