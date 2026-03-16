import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, useId } from "react";
import styles from "./Switch.module.scss";

export type SwitchProps = {
	checked?: boolean;
	className?: ClassValue;
	defaultChecked?: boolean;
	disabled?: boolean;
	id?: string;
	label?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function Switch({ checked, className, defaultChecked, disabled, id, label, onChange }: SwitchProps) {
	const autoId = useId();
	const inputId = id ?? autoId;

	return (
		<label className={clsx(styles.switch, { [styles.disabled]: disabled }, className)} htmlFor={inputId}>
			<input
				checked={checked}
				className={styles.input}
				defaultChecked={defaultChecked}
				disabled={disabled}
				id={inputId}
				onChange={onChange}
				type="checkbox"
			/>
			<span className={styles.track}>
				<span className={styles.thumb} />
			</span>
			{label ? <span className={styles.label}>{label}</span> : null}
		</label>
	);
}
