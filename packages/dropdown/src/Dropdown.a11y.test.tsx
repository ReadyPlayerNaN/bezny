import { render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Dropdown } from "./Dropdown";

function TestDropdown() {
	const anchorRef = useRef<HTMLButtonElement>(null);
	return (
		<>
			<button ref={anchorRef} type="button">
				Toggle
			</button>
			<Dropdown open={true} onClose={() => undefined} anchorRef={anchorRef}>
				<button type="button" role="menuitem">
					Option 1
				</button>
			</Dropdown>
		</>
	);
}

describe("Dropdown a11y", () => {
	it("has no accessibility violations", async () => {
		render(<TestDropdown />);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
