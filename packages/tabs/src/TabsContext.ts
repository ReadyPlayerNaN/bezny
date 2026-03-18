import { createContext, useContext } from "react";

type TabsContextValue = {
	activeValue: string;
	baseId: string;
	onSelect: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
	const context = useContext(TabsContext);
	if (context === null) {
		throw new Error("useTabs must be used within a Tabs component");
	}
	return context;
}

export { TabsContext, type TabsContextValue, useTabs };
