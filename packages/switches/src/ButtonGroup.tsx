import clsx, { type ClassValue } from "clsx";
import { type ReactNode, useCallback, useMemo } from "react";
import styles from "./ButtonGroup.module.scss";
import { ButtonGroupContext, type ButtonGroupContextValue } from "./ButtonGroupContext";

export type ButtonGroupProps = {
	children: ReactNode;
	className?: ClassValue;
	defaultValue?: string;
	disabled?: boolean;
	legend?: string;
	onChange?: (value: string) => void;
	value?: string;
};

export function ButtonGroup({ children, className, defaultValue, disabled, legend, onChange, value }: ButtonGroupProps) {
	const handleChange = useCallback(
		(itemValue: string) => {
			onChange?.(itemValue);
		},
		[onChange],
	);

	const ctx = useMemo<ButtonGroupContextValue>(
		() => ({ disabled, onChange: handleChange, value: value ?? defaultValue }),
		[defaultValue, disabled, handleChange, value],
	);

	return (
		<ButtonGroupContext.Provider value={ctx}>
			<fieldset className={clsx(styles.group, className)} disabled={disabled} role="radiogroup">
				{legend ? <legend className={styles.legend}>{legend}</legend> : null}
				{children}
			</fieldset>
		</ButtonGroupContext.Provider>
	);
}
