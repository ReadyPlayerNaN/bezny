import { Tab } from "./Tab";
import { TabList } from "./TabList";
import { TabPanel } from "./TabPanel";
import { Tabs as TabsBase } from "./Tabs";

export { Tab, type TabProps } from "./Tab";
export { TabList, type TabListProps } from "./TabList";
export { TabPanel, type TabPanelProps } from "./TabPanel";
export type { TabsOwnProps } from "./Tabs";
export { type TabsContextValue, useTabs } from "./TabsContext";

export const Tabs = Object.assign(TabsBase, {
	// biome-ignore lint/style/useNamingConvention: React compound component convention
	List: TabList,
	// biome-ignore lint/style/useNamingConvention: React compound component convention
	Tab: Tab,
	// biome-ignore lint/style/useNamingConvention: React compound component convention
	Panel: TabPanel,
});
