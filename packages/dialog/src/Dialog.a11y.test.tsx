import { render } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Dialog } from "./Dialog";

beforeAll(() => {
	HTMLDialogElement.prototype.showModal ??= function () {
		this.setAttribute("open", "");
	};
	HTMLDialogElement.prototype.close ??= function () {
		this.removeAttribute("open");
	};
});

describe("Dialog a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(
			<Dialog open={true} onClose={() => undefined}>
				<Dialog.Header onClose={() => undefined}>Title</Dialog.Header>
				<Dialog.Body>Content</Dialog.Body>
			</Dialog>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
