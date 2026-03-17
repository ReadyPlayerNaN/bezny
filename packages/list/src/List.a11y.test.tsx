import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { List } from "./List";
import { ListColumn } from "./ListColumn";

describe("List a11y", () => {
	it("has no accessibility violations", async () => {
		const data = [{ id: 1, name: "Item 1" }];
		const { container } = render(
			<List data={data} keyOf={(item) => item.id}>
				<ListColumn render={(item) => item.name} />
			</List>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
