import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, useEffect, useId, useRef } from "react";
import styles from "./Checkbox.module.scss";

export type CheckboxProps = {
	checked?: boolean;
	className?: ClassValue;
	defaultChecked?: boolean;
	disabled?: boolean;
	id?: string;
	indeterminate?: boolean;
	label?: string;
	name?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function Checkbox({
	checked,
	className,
	defaultChecked,
	disabled,
	id,
	indeterminate,
	label,
	name,
	onChange,
}: CheckboxProps) {
	const autoId = useId();
	const inputId = id ?? autoId;
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.indeterminate = indeterminate ?? false;
		}
	}, [indeterminate]);

	return (
		<label className={clsx(styles.checkbox, { [styles.disabled]: disabled }, className)} htmlFor={inputId}>
			<input
				checked={checked}
				className={styles.input}
				defaultChecked={defaultChecked}
				disabled={disabled}
				id={inputId}
				name={name}
				onChange={onChange}
				ref={inputRef}
				type="checkbox"
			/>
			<span
				className={clsx(styles.indicator, {
					[styles.indeterminate]: indeterminate,
				})}
			/>
			{label ? <span className={styles.label}>{label}</span> : null}
		</label>
	);
}
