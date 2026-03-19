import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./Badge.module.scss";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "primary" | "secondary";
export type BadgeSize = "sm" | "md";

export type BadgeProps = {
	children?: ReactNode;
	className?: ClassValue;
	dot?: boolean;
	size?: BadgeSize;
	variant?: BadgeVariant;
};

const variantClassMap: Record<BadgeVariant, string> = {
	default: styles.default,
	success: styles.success,
	warning: styles.warning,
	danger: styles.danger,
	info: styles.info,
	primary: styles.primary,
	secondary: styles.secondary,
};

const sizeClassMap: Record<BadgeSize, string> = {
	sm: styles.sm,
	md: styles.md,
};

export function Badge({ children, className, dot, size = "md", variant = "default" }: BadgeProps) {
	return (
		<span className={clsx(styles.badge, variantClassMap[variant], sizeClassMap[size], className)}>
			{dot && <span className={styles.dot} aria-hidden="true" />}
			{children}
		</span>
	);
}
