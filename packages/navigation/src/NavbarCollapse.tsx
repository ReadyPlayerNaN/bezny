import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./NavbarCollapse.module.scss";
import { useNavbar } from "./NavbarContext";

export type NavbarCollapseProps = {
	children?: ReactNode;
	className?: ClassValue;
};

export function NavbarCollapse({ children, className }: NavbarCollapseProps) {
	const { expanded } = useNavbar();

	return <div className={clsx(styles.collapse, expanded && styles.expanded, className)}>{children}</div>;
}
