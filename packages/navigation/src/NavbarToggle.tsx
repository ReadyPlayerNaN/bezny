import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import { useNavbar } from "./NavbarContext";
import styles from "./NavbarToggle.module.scss";

export type NavbarToggleProps = {
	children?: ReactNode;
	className?: ClassValue;
};

export function NavbarToggle({ children, className }: NavbarToggleProps) {
	const { expanded, onToggle } = useNavbar();

	return (
		<button
			aria-expanded={expanded}
			aria-label="Toggle navigation"
			className={clsx(styles.toggle, className)}
			onClick={() => onToggle(!expanded)}
			type="button"
		>
			{children ?? <span className={styles.icon} />}
		</button>
	);
}
