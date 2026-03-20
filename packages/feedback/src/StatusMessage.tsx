import clsx, { type ClassValue } from "clsx";
import styles from "./StatusMessage.module.scss";

type ValidationStatus = "error" | "warning" | "success";

export type StatusMessageProps = {
	className?: ClassValue;
	id?: string;
	message?: string;
	status?: ValidationStatus;
};

const statusClassMap: Record<ValidationStatus, string> = {
	error: styles.messageError,
	warning: styles.messageWarning,
	success: styles.messageSuccess,
};

const statusRoleMap: Record<ValidationStatus, string> = {
	error: "alert",
	warning: "alert",
	success: "status",
};

export function StatusMessage({ className, id, message, status }: StatusMessageProps) {
	if (!(message && status)) {
		return null;
	}

	return (
		<span
			className={clsx(styles.statusMessage, statusClassMap[status], className)}
			id={id}
			role={statusRoleMap[status]}
		>
			{message}
		</span>
	);
}
