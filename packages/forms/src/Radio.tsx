import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, useId } from "react";
import styles from "./Radio.module.scss";

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
	const autoId = useId();
	const inputId = id ?? autoId;

	return (
		<label className={clsx(styles.radio, { [styles.disabled]: disabled }, className)} htmlFor={inputId}>
			<input
				checked={checked}
				className={styles.input}
				defaultChecked={defaultChecked}
				disabled={disabled}
				id={inputId}
				name={name}
				onChange={onChange}
				type="radio"
				value={value}
			/>
			<span className={styles.indicator} />
			{label ? <span className={styles.label}>{label}</span> : null}
		</label>
	);
}
