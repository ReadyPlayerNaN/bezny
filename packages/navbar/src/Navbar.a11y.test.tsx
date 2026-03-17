import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Navbar } from "./Navbar";
import { NavbarBrand } from "./NavbarBrand";
import { NavbarCollapse } from "./NavbarCollapse";
import { NavbarToggle } from "./NavbarToggle";

describe("Navbar a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(
			<Navbar>
				<NavbarBrand>Brand</NavbarBrand>
				<NavbarToggle />
				<NavbarCollapse>
					<a href="/home">Home</a>
				</NavbarCollapse>
			</Navbar>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
