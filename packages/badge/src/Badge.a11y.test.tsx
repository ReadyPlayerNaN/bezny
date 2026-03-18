import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Badge } from "./Badge";

describe("Badge a11y", () => {
	it("has no accessibility violations", async () => {
		render(<Badge>Active</Badge>);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});

	it("has no accessibility violations with variant", async () => {
		render(<Badge variant="success">Published</Badge>);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
