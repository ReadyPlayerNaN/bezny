import clsx, { type ClassValue } from "clsx";
import { type ReactNode, useCallback, useMemo } from "react";
import styles from "./RadioGroup.module.scss";
import { RadioGroupContext, type RadioGroupContextValue } from "./RadioGroupContext";

export type RadioGroupProps = {
	children: ReactNode;
	className?: ClassValue;
	disabled?: boolean;
	legend?: string;
	name?: string;
	onChange?: (value: string) => void;
	value?: string;
};

export function RadioGroup({ children, className, disabled, legend, name, onChange, value }: RadioGroupProps) {
	const handleChange = useCallback(
		(itemValue: string) => {
			onChange?.(itemValue);
		},
		[onChange],
	);

	const ctx = useMemo<RadioGroupContextValue>(
		() => ({ disabled: disabled, name: name, onChange: handleChange, value: value }),
		[disabled, handleChange, name, value],
	);

	return (
		<RadioGroupContext.Provider value={ctx}>
			<fieldset className={clsx(styles.group, className)} disabled={disabled}>
				{legend ? <legend className={styles.legend}>{legend}</legend> : null}
				{children}
			</fieldset>
		</RadioGroupContext.Provider>
	);
}
