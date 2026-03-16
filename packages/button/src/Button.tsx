import { createPolymorphic } from "@bezny/styles";
import clsx, { type ClassValue } from "clsx";
import styles from "./Button.module.scss";

type ButtonVariant = "default" | "primary" | "secondary" | "ghost";

export type ButtonOwnProps = {
	className?: ClassValue;
	variant?: ButtonVariant;
};

const variantClassMap: Record<ButtonVariant, string> = {
	default: styles.neutral,
	primary: styles.primary,
	secondary: styles.secondary,
	ghost: styles.ghost,
};

export const Button = createPolymorphic<"button", ButtonOwnProps>(
	"button",
	(Tag, { className, variant = "default" }, { className: _, variant: _v, type = "button", ...rest }) => (
		<Tag
			className={clsx(styles.button, variantClassMap[variant], className)}
			type={type}
			{...rest}
		/>
	),
);
