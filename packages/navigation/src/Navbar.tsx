import clsx, { type ClassValue } from "clsx";
import { type ReactNode, useState } from "react";
import styles from "./Navbar.module.scss";
import { NavbarContext } from "./NavbarContext";

export type NavbarProps = {
	children?: ReactNode;
	className?: ClassValue;
	expanded?: boolean;
	onToggle?: (expanded: boolean) => void;
};

export function Navbar({ children, className, expanded: controlledExpanded, onToggle }: NavbarProps) {
	const [internalExpanded, setInternalExpanded] = useState(false);
	const isControlled = controlledExpanded !== undefined;
	const expanded = isControlled ? controlledExpanded : internalExpanded;
	const handleToggle = isControlled && onToggle ? onToggle : setInternalExpanded;

	return (
		<NavbarContext value={{ expanded: expanded, onToggle: handleToggle }}>
			<nav className={clsx(styles.navbar, className)}>{children}</nav>
		</NavbarContext>
	);
}
