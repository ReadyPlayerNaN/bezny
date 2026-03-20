import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Toast } from "./Toast";

describe("Toast a11y", () => {
	it("has no accessibility violations with info variant", async () => {
		const { container } = render(<Toast variant="info">File uploaded</Toast>);
		expect(await axe(container)).toHaveNoViolations();
	});

	it("has no accessibility violations with success variant", async () => {
		const { container } = render(<Toast variant="success">Operation completed</Toast>);
		expect(await axe(container)).toHaveNoViolations();
	});

	it("has no accessibility violations with warning variant", async () => {
		const { container } = render(<Toast variant="warning">Connection unstable</Toast>);
		expect(await axe(container)).toHaveNoViolations();
	});

	it("has no accessibility violations with error variant", async () => {
		const { container } = render(<Toast variant="error">Something went wrong</Toast>);
		expect(await axe(container)).toHaveNoViolations();
	});

	it("has no accessibility violations with close button", async () => {
		const { container } = render(
			<Toast variant="info" onClose={() => undefined}>
				Dismissible toast
			</Toast>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});

	it("has no accessibility violations with actions", async () => {
		const { container } = render(
			<Toast variant="info" actions={<button type="button">Undo</button>}>
				Item deleted
			</Toast>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
