import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
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
				<Tab value="three">Tab Three</Tab>
			</TabList>
			<TabPanel value="one">Content one</TabPanel>
			<TabPanel value="two">Content two</TabPanel>
			<TabPanel value="three">Content three</TabPanel>
		</Tabs>
	);
}

describe("Tabs keyboard navigation", () => {
	it("moves focus right with ArrowRight and wraps around", async () => {
		const user = userEvent.setup();
		render(<TestTabs />);
		const tabOne = screen.getByRole("tab", { name: "Tab One" });
		const tabTwo = screen.getByRole("tab", { name: "Tab Two" });
		const tabThree = screen.getByRole("tab", { name: "Tab Three" });

		tabOne.focus();
		await user.keyboard("{ArrowRight}");
		expect(tabTwo).toHaveFocus();

		await user.keyboard("{ArrowRight}");
		expect(tabThree).toHaveFocus();

		await user.keyboard("{ArrowRight}");
		expect(tabOne).toHaveFocus();
	});

	it("moves focus left with ArrowLeft and wraps around", async () => {
		const user = userEvent.setup();
		render(<TestTabs />);
		const tabOne = screen.getByRole("tab", { name: "Tab One" });
		const tabThree = screen.getByRole("tab", { name: "Tab Three" });

		tabOne.focus();
		await user.keyboard("{ArrowLeft}");
		expect(tabThree).toHaveFocus();
	});

	it("moves focus to first tab with Home", async () => {
		const user = userEvent.setup();
		render(<TestTabs />);
		const tabOne = screen.getByRole("tab", { name: "Tab One" });
		const tabThree = screen.getByRole("tab", { name: "Tab Three" });

		tabThree.focus();
		await user.keyboard("{Home}");
		expect(tabOne).toHaveFocus();
	});

	it("moves focus to last tab with End", async () => {
		const user = userEvent.setup();
		render(<TestTabs />);
		const tabOne = screen.getByRole("tab", { name: "Tab One" });
		const tabThree = screen.getByRole("tab", { name: "Tab Three" });

		tabOne.focus();
		await user.keyboard("{End}");
		expect(tabThree).toHaveFocus();
	});

	it("activates the tab when navigating with arrow keys", async () => {
		const user = userEvent.setup();
		render(<TestTabs />);
		const tabOne = screen.getByRole("tab", { name: "Tab One" });

		tabOne.focus();
		await user.keyboard("{ArrowRight}");
		expect(screen.getByText("Content two")).toBeInTheDocument();
	});
});
