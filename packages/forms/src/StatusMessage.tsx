import clsx from "clsx";
import styles from "./StatusMessage.module.scss";

export type ValidationStatus = "error" | "warning" | "success";

type StatusMessageProps = {
	message: string;
	status: ValidationStatus;
};

const statusClassMap: Record<ValidationStatus, string> = {
	error: styles.error,
	warning: styles.warning,
	success: styles.success,
};

export function StatusMessage({ message, status }: StatusMessageProps) {
	return <span className={clsx(styles.statusMessage, statusClassMap[status])}>{message}</span>;
}
