import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Nav } from "./Nav";
import { NavLink } from "./NavLink";

describe("Nav a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(
			<Nav>
				<NavLink href="/home" active={true}>
					Home
				</NavLink>
				<NavLink href="/about">About</NavLink>
			</Nav>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
