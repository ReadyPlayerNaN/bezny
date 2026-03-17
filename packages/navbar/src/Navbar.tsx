import clsx, { type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { useId, useState } from "react";
import styles from "./Navbar.module.scss";
import { NavbarContext } from "./NavbarContext";

export type NavbarOwnProps = {
	className?: ClassValue;
	expanded?: boolean;
	onToggle?: (expanded: boolean) => void;
};

export type NavbarProps<T extends ElementType = "nav"> = NavbarOwnProps &
	Omit<ComponentPropsWithoutRef<T>, keyof NavbarOwnProps | "asChild"> & {
		asChild?: T;
	};

export function Navbar<T extends ElementType = "nav">({
	asChild,
	className,
	expanded: controlledExpanded,
	onToggle,
	...rest
}: NavbarProps<T>) {
	const [internalExpanded, setInternalExpanded] = useState(false);
	const collapseId = useId();
	const isControlled = controlledExpanded !== undefined;
	const expanded = isControlled ? controlledExpanded : internalExpanded;
	const handleToggle = isControlled && onToggle ? onToggle : setInternalExpanded;
	const Tag = asChild ?? "nav";

	return (
		<NavbarContext value={{ collapseId: collapseId, expanded: expanded, onToggle: handleToggle }}>
			<Tag className={clsx(styles.navbar, className)} {...rest} />
		</NavbarContext>
	);
}
