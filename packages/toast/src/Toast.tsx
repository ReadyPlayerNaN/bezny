import clsx, { type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Toast.module.scss";

type ToastVariant = "info" | "success" | "warning" | "error";

export type ToastProps = Omit<ComponentPropsWithoutRef<"div">, "className"> & {
	actions?: ReactNode;
	className?: ClassValue;
	onClose?: () => void;
	variant?: ToastVariant;
};

const variantClassMap: Record<ToastVariant, string> = {
	info: styles.info,
	success: styles.success,
	warning: styles.warning,
	error: styles.error,
};

const variantRoleMap: Record<ToastVariant, string> = {
	info: "status",
	success: "status",
	warning: "alert",
	error: "alert",
};

export function Toast({ actions, children, className, onClose, variant = "info", ...rest }: ToastProps) {
	return (
		<div
			className={clsx(styles.toast, variantClassMap[variant], className)}
			role={variantRoleMap[variant]}
			aria-live={variant === "error" || variant === "warning" ? "assertive" : "polite"}
			{...rest}
		>
			<div className={styles.content}>{children}</div>
			{actions && <div className={styles.actions}>{actions}</div>}
			{onClose && (
				<button aria-label="Close" className={styles.close} onClick={onClose} type="button">
					&times;
				</button>
			)}
		</div>
	);
}
