import clsx, { type ClassValue } from "clsx";
import { type ReactNode, useCallback, useMemo } from "react";
import styles from "./CheckboxGroup.module.scss";
import { CheckboxGroupContext, type CheckboxGroupContextValue } from "./CheckboxGroupContext";

export type CheckboxGroupProps = {
	children: ReactNode;
	className?: ClassValue;
	disabled?: boolean;
	legend?: string;
	onChange?: (values: string[]) => void;
	value?: string[];
};

export function CheckboxGroup({ children, className, disabled, legend, onChange, value }: CheckboxGroupProps) {
	const handleChange = useCallback(
		(itemValue: string, checked: boolean) => {
			if (!onChange || !value) return;
			if (checked) {
				onChange([...value, itemValue]);
			} else {
				onChange(value.filter((v) => v !== itemValue));
			}
		},
		[onChange, value],
	);

	const ctx = useMemo<CheckboxGroupContextValue>(
		() => ({ disabled, onChange: handleChange, value }),
		[disabled, handleChange, value],
	);

	return (
		<CheckboxGroupContext.Provider value={ctx}>
			<fieldset className={clsx(styles.group, className)} disabled={disabled}>
				{legend ? <legend className={styles.legend}>{legend}</legend> : null}
				{children}
			</fieldset>
		</CheckboxGroupContext.Provider>
	);
}
