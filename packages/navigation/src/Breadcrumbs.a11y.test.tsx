import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { BreadcrumbItem, Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(
			<Breadcrumbs>
				<BreadcrumbItem>
					<a href="/">Home</a>
				</BreadcrumbItem>
				<BreadcrumbItem>
					<a href="/products">Products</a>
				</BreadcrumbItem>
				<BreadcrumbItem>Current</BreadcrumbItem>
			</Breadcrumbs>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
