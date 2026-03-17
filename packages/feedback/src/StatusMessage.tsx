import clsx, { type ClassValue } from "clsx";
import styles from "./StatusMessage.module.scss";

type ValidationStatus = "error" | "warning" | "success";

export type StatusMessageProps = {
	className?: ClassValue;
	id?: string;
	message?: string;
	status?: ValidationStatus;
};

export function StatusMessage({ className, id, message, status }: StatusMessageProps) {
	if (!(message && status)) {
		return null;
	}

	return (
		<span
			className={clsx(styles.statusMessage, className, {
				[styles.messageError]: status === "error",
				[styles.messageWarning]: status === "warning",
				[styles.messageSuccess]: status === "success",
			})}
			id={id}
			role={status === "success" ? "status" : "alert"}
		>
			{message}
		</span>
	);
}
