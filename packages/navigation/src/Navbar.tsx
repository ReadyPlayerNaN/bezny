import { createPolymorphic } from "@bezny/styles";
import clsx, { type ClassValue } from "clsx";
import { useState } from "react";
import styles from "./Navbar.module.scss";
import { NavbarContext } from "./NavbarContext";

export type NavbarOwnProps = {
	className?: ClassValue;
	expanded?: boolean;
	onToggle?: (expanded: boolean) => void;
};

export const Navbar = createPolymorphic<"nav", NavbarOwnProps>(
	"nav",
	(Tag, { className, expanded: controlledExpanded, onToggle }, { className: _, expanded: _e, onToggle: _t, ...rest }) => {
		const [internalExpanded, setInternalExpanded] = useState(false);
		const isControlled = controlledExpanded !== undefined;
		const expanded = isControlled ? controlledExpanded : internalExpanded;
		const handleToggle = isControlled && onToggle ? onToggle : setInternalExpanded;

		return (
			<NavbarContext value={{ expanded, onToggle: handleToggle }}>
				<Tag className={clsx(styles.navbar, className)} {...rest} />
			</NavbarContext>
		);
	},
);
