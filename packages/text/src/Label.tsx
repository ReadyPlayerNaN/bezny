import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./Label.module.scss";

export type LabelProps = {
	children?: ReactNode;
	className?: ClassValue;
	htmlFor?: string;
};

export function Label({ children, className, htmlFor }: LabelProps) {
	return (
		<label className={clsx(styles.label, className)} htmlFor={htmlFor}>
			{children}
		</label>
	);
}
