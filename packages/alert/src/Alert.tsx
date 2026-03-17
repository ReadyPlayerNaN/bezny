import { createPolymorphic } from "@bezny/styles";
import clsx, { type ClassValue } from "clsx";
import styles from "./Alert.module.scss";

type AlertVariant = "success" | "warning" | "error";

export type AlertOwnProps = {
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

export const Alert = createPolymorphic<"div", AlertOwnProps>(
	"div",
	(Tag, { className, variant }, { className: _, variant: _v, ...rest }) => (
		<Tag className={clsx(styles.alert, variantClassMap[variant], className)} role={variantRoleMap[variant]} {...rest} />
	),
);
