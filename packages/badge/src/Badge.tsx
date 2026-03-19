import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./Badge.module.scss";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "primary" | "secondary";

export type BadgeProps = {
	children?: ReactNode;
	className?: ClassValue;
	dot?: boolean;
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

export function Badge({ children, className, dot, variant = "default" }: BadgeProps) {
	return (
		<span className={clsx(styles.badge, variantClassMap[variant], className)}>
			{dot && <span className={styles.dot} aria-hidden="true" />}
			{children}
		</span>
	);
}
