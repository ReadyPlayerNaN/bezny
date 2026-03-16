import type { ClassValue } from "clsx";
import clsx from "clsx";
import { type ChangeEvent, useEffect, useRef } from "react";
import styles from "./Checkbox.module.scss";
import { useCheckboxGroup } from "./CheckboxGroupContext";
import { SwitchGroup, useSwitchId } from "./SwitchGroup";

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
	const inputId = useSwitchId(id);
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
		<SwitchGroup
			className={className}
			disabled={isDisabled}
			disabledClassName={styles.disabled}
			htmlFor={inputId}
			label={label}
			rootClassName={styles.checkbox}
		>
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
		</SwitchGroup>
	);
}
