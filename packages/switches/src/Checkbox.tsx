import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, useEffect, useId, useRef } from "react";
import styles from "./Checkbox.module.scss";
import { useCheckboxGroup } from "./CheckboxGroupContext";

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
	value?: string;
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
	value,
}: CheckboxProps) {
	const group = useCheckboxGroup();
	const autoId = useId();
	const inputId = id ?? autoId;
	const inputRef = useRef<HTMLInputElement>(null);

	const isDisabled = disabled ?? group?.disabled;
	const isChecked = checked ?? (group?.value && value ? group.value.includes(value) : undefined);

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChange?.(e);
		if (group?.onChange && value) {
			group.onChange(value, e.target.checked);
		}
	};

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.indeterminate = indeterminate ?? false;
		}
	}, [indeterminate]);

	return (
		<label className={clsx(styles.checkbox, { [styles.disabled]: isDisabled }, className)} htmlFor={inputId}>
			<input
				checked={isChecked}
				className={styles.input}
				defaultChecked={group ? undefined : defaultChecked}
				disabled={isDisabled}
				id={inputId}
				name={name}
				onChange={handleChange}
				ref={inputRef}
				type="checkbox"
				value={value}
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
