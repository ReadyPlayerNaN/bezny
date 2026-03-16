import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createPolymorphic } from "./createPolymorphic";

describe("createPolymorphic", () => {
	it("renders the default HTML tag", () => {
		const Box = createPolymorphic("div", (Tag, _ownProps, rest) => (
			<Tag data-testid="box" {...rest} />
		));

		render(<Box>hello</Box>);
		const el = screen.getByTestId("box");
		expect(el.tagName).toBe("DIV");
		expect(el).toHaveTextContent("hello");
	});

	it("renders a different HTML tag via asChild", () => {
		const Box = createPolymorphic("div", (Tag, _ownProps, rest) => (
			<Tag data-testid="box" {...rest} />
		));

		render(<Box asChild="section">hello</Box>);
		const el = screen.getByTestId("box");
		expect(el.tagName).toBe("SECTION");
	});

	it("passes own props to the render function", () => {
		type OwnProps = { variant: "a" | "b" };

		const Box = createPolymorphic<"div", OwnProps>(
			"div",
			(Tag, { variant }, rest) => (
				<Tag data-testid="box" data-variant={variant} {...rest} />
			),
		);

		render(<Box variant="a">hello</Box>);
		expect(screen.getByTestId("box")).toHaveAttribute("data-variant", "a");
	});

	it("passes HTML attributes through rest for the default tag", () => {
		const Box = createPolymorphic("a", (Tag, _ownProps, rest) => (
			<Tag data-testid="box" {...rest} />
		));

		render(<Box href="/test">link</Box>);
		expect(screen.getByTestId("box")).toHaveAttribute("href", "/test");
	});

	it("renders a React component via asChild", () => {
		function CustomLink(props: { to: string; children?: React.ReactNode }) {
			return (
				<a data-testid="custom" href={props.to}>
					{props.children}
				</a>
			);
		}

		const Box = createPolymorphic("div", (Tag, _ownProps, rest) => (
			<Tag {...rest} />
		));

		render(
			<Box asChild={CustomLink} to="/custom">
				hello
			</Box>,
		);
		const el = screen.getByTestId("custom");
		expect(el).toHaveAttribute("href", "/custom");
		expect(el).toHaveTextContent("hello");
	});

	it("does not pass asChild to the rendered element", () => {
		const Box = createPolymorphic("div", (Tag, _ownProps, rest) => (
			<Tag data-testid="box" {...rest} />
		));

		render(<Box>hello</Box>);
		expect(screen.getByTestId("box")).not.toHaveAttribute("asChild");
		expect(screen.getByTestId("box")).not.toHaveAttribute("aschild");
	});
});
