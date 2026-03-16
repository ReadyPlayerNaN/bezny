import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import { useId } from "react";
import styles from "./InputLabel.module.scss";

export function useSwitchId(id?: string) {
	const autoId = useId();
	return id ?? autoId;
}

export function SwitchGroup({
	children,
	className,
	disabled,
	disabledClassName,
	htmlFor,
	label,
	rootClassName,
}: {
	children: ReactNode;
	className?: ClassValue;
	disabled?: boolean;
	disabledClassName?: string;
	htmlFor: string;
	label?: string;
	rootClassName?: string;
}) {
	return (
		<label className={clsx(rootClassName, disabled && disabledClassName, className)} htmlFor={htmlFor}>
			{children}
			{label ? <span className={styles.label}>{label}</span> : null}
		</label>
	);
}
