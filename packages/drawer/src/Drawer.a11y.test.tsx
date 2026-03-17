import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Drawer } from "./Drawer";

describe("Drawer a11y", () => {
	it("has no accessibility violations", async () => {
		render(
			<Drawer aria-label="Navigation drawer" open={true} onClose={() => undefined}>
				Drawer content
			</Drawer>,
		);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
