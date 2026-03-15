import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./Nav.module.scss";

export type NavProps = {
	align?: "start" | "end";
	children?: ReactNode;
	className?: ClassValue;
};

export function Nav({ align = "start", children, className }: NavProps) {
	return <div className={clsx(styles.nav, align === "end" && styles.end, className)}>{children}</div>;
}
