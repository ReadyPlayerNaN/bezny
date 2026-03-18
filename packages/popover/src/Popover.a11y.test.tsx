import { render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Popover } from "./Popover";

function TestPopover() {
	const anchorRef = useRef<HTMLButtonElement>(null);
	return (
		<>
			<button ref={anchorRef} type="button">
				Open popover
			</button>
			<Popover open={true} onClose={() => undefined} anchorRef={anchorRef}>
				<p>Popover content</p>
			</Popover>
		</>
	);
}

describe("Popover a11y", () => {
	it("has no accessibility violations", async () => {
		render(<TestPopover />);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
