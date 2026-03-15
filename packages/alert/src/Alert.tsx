import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./Alert.module.scss";

type AlertVariant = "success" | "warning" | "error";

export type AlertProps = {
	children?: ReactNode;
	className?: ClassValue;
	variant: AlertVariant;
};

const variantClassMap: Record<AlertVariant, string> = {
	success: styles.success,
	warning: styles.warning,
	error: styles.error,
};

const variantRoleMap: Record<AlertVariant, string> = {
	success: "status",
	warning: "alert",
	error: "alert",
};

export function Alert({ children, className, variant }: AlertProps) {
	return (
		<div className={clsx(styles.alert, variantClassMap[variant], className)} role={variantRoleMap[variant]}>
			{children}
		</div>
	);
}
