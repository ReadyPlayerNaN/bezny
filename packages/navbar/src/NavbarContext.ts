import { createContext, useContext } from "react";

export type NavbarContextValue = {
	expanded: boolean;
	onToggle: (expanded: boolean) => void;
};

const NavbarContext = createContext<NavbarContextValue | null>(null);

export function useNavbar(): NavbarContextValue {
	const context = useContext(NavbarContext);
	if (context === null) {
		throw new Error("useNavbar must be used within a Navbar component");
	}
	return context;
}

export { NavbarContext };
