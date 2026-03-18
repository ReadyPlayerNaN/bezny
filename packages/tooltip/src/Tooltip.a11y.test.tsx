import { render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Tooltip } from "./Tooltip";

function TestTooltip() {
	const anchorRef = useRef<HTMLButtonElement>(null);
	return (
		<>
			<button ref={anchorRef} type="button" aria-describedby="test-tooltip">
				Hover me
			</button>
			<Tooltip id="test-tooltip" open={true} anchorRef={anchorRef}>
				Tooltip content
			</Tooltip>
		</>
	);
}

describe("Tooltip a11y", () => {
	it("has no accessibility violations", async () => {
		render(<TestTooltip />);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
