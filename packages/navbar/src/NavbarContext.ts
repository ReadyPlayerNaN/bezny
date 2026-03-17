import { createContext, useContext } from "react";

type NavbarContextValue = {
	collapseId: string;
	expanded: boolean;
	onToggle: (expanded: boolean) => void;
};

const NavbarContext = createContext<NavbarContextValue | null>(null);

function useNavbar(): NavbarContextValue {
	const context = useContext(NavbarContext);
	if (context === null) {
		throw new Error("useNavbar must be used within a Navbar component");
	}
	return context;
}

export { NavbarContext, type NavbarContextValue, useNavbar };
