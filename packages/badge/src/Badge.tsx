import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./Badge.module.scss";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

export type BadgeProps = {
	children?: ReactNode;
	className?: ClassValue;
	variant?: BadgeVariant;
};

const variantClassMap: Record<BadgeVariant, string> = {
	default: styles.default,
	success: styles.success,
	warning: styles.warning,
	danger: styles.danger,
	info: styles.info,
};

export function Badge({ children, className, variant = "default" }: BadgeProps) {
	return <span className={clsx(styles.badge, variantClassMap[variant], className)}>{children}</span>;
}
