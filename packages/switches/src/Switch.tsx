import type { ClassValue } from "clsx";
import type { ChangeEvent } from "react";
import { SwitchGroup, useSwitchId } from "./SwitchGroup";
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
	const inputId = useSwitchId(id);

	return (
		<SwitchGroup
			className={className}
			disabled={disabled}
			disabledClassName={styles.disabled}
			htmlFor={inputId}
			label={label}
			rootClassName={styles.switch}
		>
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
		</SwitchGroup>
	);
}
