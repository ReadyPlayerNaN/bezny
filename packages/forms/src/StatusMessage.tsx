import { createPolymorphic } from "@bezny/styles";
import clsx, { type ClassValue } from "clsx";
import styles from "./StatusMessage.module.scss";

export type ValidationStatus = "error" | "warning" | "success";

const statusClassMap: Record<ValidationStatus, string> = {
	error: styles.error,
	warning: styles.warning,
	success: styles.success,
};

export type StatusMessageOwnProps = {
	className?: ClassValue;
	message: string;
	status: ValidationStatus;
};

export const StatusMessage = createPolymorphic<"span", StatusMessageOwnProps>(
	"span",
	(Tag, { className, message, status }, { className: _className, message: _, status: _status, ...rest }) => (
		<Tag {...rest} className={clsx(styles.statusMessage, statusClassMap[status], className)}>
			{message}
		</Tag>
	),
);
