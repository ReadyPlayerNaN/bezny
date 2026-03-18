import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Tab } from "./Tab";
import { TabList } from "./TabList";
import { TabPanel } from "./TabPanel";
import { Tabs } from "./Tabs";

function TestTabs() {
	return (
		<Tabs defaultValue="one">
			<TabList aria-label="Sample tabs">
				<Tab value="one">Tab One</Tab>
				<Tab value="two">Tab Two</Tab>
			</TabList>
			<TabPanel value="one">Content one</TabPanel>
			<TabPanel value="two">Content two</TabPanel>
		</Tabs>
	);
}

describe("Tabs a11y", () => {
	it("has no accessibility violations", async () => {
		render(<TestTabs />);
		expect(
			await axe(document.body, {
				rules: { region: { enabled: false } },
			}),
		).toHaveNoViolations();
	});
});
