import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { CodeBlock } from "./CodeBlock";
import { InlineCode } from "./InlineCode";

describe("InlineCode a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(
			<p>
				Use the <InlineCode>console.log</InlineCode> function
			</p>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("CodeBlock a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(
			<CodeBlock>
				<code>const x = 1;</code>
			</CodeBlock>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
