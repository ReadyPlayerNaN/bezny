import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Blockquote } from "./Blockquote";
import { Heading } from "./Heading";
import { HorizontalRule } from "./HorizontalRule";
import { Link } from "./Link";
import { ListItem } from "./ListItem";
import { OrderedList } from "./OrderedList";
import { Paragraph } from "./Paragraph";
import { UnorderedList } from "./UnorderedList";

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

describe("Blockquote a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<Blockquote>A quoted passage</Blockquote>);
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("HorizontalRule a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<HorizontalRule />);
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("OrderedList a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(
			<OrderedList>
				<ListItem>Item one</ListItem>
			</OrderedList>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("UnorderedList a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(
			<UnorderedList>
				<ListItem>Item one</ListItem>
			</UnorderedList>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
