import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, useId } from "react";
import styles from "./Radio.module.scss";
import { useRadioGroup } from "./RadioGroupContext";

export type RadioProps = {
	checked?: boolean;
	className?: ClassValue;
	defaultChecked?: boolean;
	disabled?: boolean;
	id?: string;
	label?: string;
	name?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	value?: string;
};

export function Radio({ checked, className, defaultChecked, disabled, id, label, name, onChange, value }: RadioProps) {
	const group = useRadioGroup();
	const autoId = useId();
	const inputId = id ?? autoId;

	const isDisabled = disabled ?? group?.disabled;
	const isChecked = checked ?? (group?.value !== undefined && value !== undefined ? group.value === value : undefined);
	const inputName = name ?? group?.name;

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChange?.(e);
		if (group?.onChange && value) {
			group.onChange(value);
		}
	};

	return (
		<label className={clsx(styles.radio, { [styles.disabled]: isDisabled }, className)} htmlFor={inputId}>
			<input
				checked={isChecked}
				className={styles.input}
				defaultChecked={group ? undefined : defaultChecked}
				disabled={isDisabled}
				id={inputId}
				name={inputName}
				onChange={handleChange}
				type="radio"
				value={value}
			/>
			<span className={styles.indicator} />
			{label ? <span className={styles.label}>{label}</span> : null}
		</label>
	);
}
