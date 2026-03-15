import clsx, { type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./Button.module.scss";

type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "className"> & {
	className?: ClassValue;
	variant?: ButtonVariant;
};

const variantClassMap: Record<ButtonVariant, string> = {
	primary: styles.primary,
	secondary: styles.secondary,
	ghost: styles.ghost,
};

export function Button({ children, className, type = "button", variant = "primary", ...rest }: ButtonProps) {
	return (
		<button className={clsx(styles.button, variantClassMap[variant], className)} type={type} {...rest}>
			{children}
		</button>
	);
}
