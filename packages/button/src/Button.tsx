import { createPolymorphic } from "@bezny/styles";
import clsx, { type ClassValue } from "clsx";
import styles from "./Button.module.scss";

type ButtonVariant = "default" | "primary" | "secondary" | "ghost" | "link";

export type ButtonOwnProps = {
	className?: ClassValue;
	variant?: ButtonVariant;
};

const variantClassMap: Record<ButtonVariant, string> = {
	default: styles.default,
	primary: styles.primary,
	secondary: styles.secondary,
	ghost: styles.ghost,
	link: styles.link,
};

export const Button = createPolymorphic<"button", ButtonOwnProps>(
	"button",
	(Tag, { className, variant = "default" }, rest) => (
		<Tag
			className={clsx(styles.button, variantClassMap[variant], className)}
			{...rest}
		/>
	),
);
