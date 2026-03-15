import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./NavbarBrand.module.scss";

export type NavbarBrandProps = {
	children?: ReactNode;
	className?: ClassValue;
	href?: string;
};

export function NavbarBrand({ children, className, href }: NavbarBrandProps) {
	const classes = clsx(styles.brand, className);

	if (href) {
		return (
			<a className={classes} href={href}>
				{children}
			</a>
		);
	}

	return <span className={classes}>{children}</span>;
}
