import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Overlay } from "./Overlay";

describe("Overlay a11y", () => {
	it("has no accessibility violations", async () => {
		render(<Overlay open={true}>Overlay content</Overlay>);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
