import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { TagListInput } from "./TagListInput";

describe("TagListInput a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(
			<TagListInput
				label="Skills"
				onChange={() => undefined}
				values={[
					{ label: "React", value: "react" },
					{ label: "TypeScript", value: "typescript" },
				]}
			/>,
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
