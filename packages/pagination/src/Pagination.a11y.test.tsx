import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Pagination } from "./Pagination";

describe("Pagination a11y", () => {
	it("has no accessibility violations", async () => {
		render(<Pagination page={3} totalPages={10} onPageChange={() => undefined} />);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});

	it("has no accessibility violations on first page", async () => {
		render(<Pagination page={1} totalPages={5} onPageChange={() => undefined} />);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
