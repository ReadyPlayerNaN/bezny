import { Alert } from "@bezny/alert";
import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, useId } from "react";
import styles from "./TextArea.module.scss";

type ValidationStatus = "error" | "warning" | "success";

export type TextAreaProps = {
	autoFocus?: boolean;
	className?: ClassValue;
	defaultValue?: string;
	disabled?: boolean;
	label?: string;
	name?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	rows?: number;
	status?: ValidationStatus;
	statusMessage?: string;
	value?: string;
};

export function TextArea({
	autoFocus,
	className,
	defaultValue,
	disabled,
	label,
	name,
	onChange,
	placeholder,
	rows = 3,
	status,
	statusMessage,
	value,
}: TextAreaProps) {
	const id = useId();
	const useWrapper = [label, status, statusMessage].some((v) => v !== undefined && v !== "");

	function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
		onChange?.(event.target.value);
	}

	if (useWrapper) {
		return (
			<div className={clsx(styles.wrapper, className)}>
				<textarea
					autoFocus={autoFocus}
					className={clsx(styles.textarea, {
						[styles.statusError]: status === "error",
						[styles.statusWarning]: status === "warning",
						[styles.statusSuccess]: status === "success",
					})}
					defaultValue={defaultValue}
					disabled={disabled}
					id={id}
					name={name}
					onChange={handleChange}
					placeholder={label ? " " : placeholder}
					rows={rows}
					value={value}
				/>
				{label ? (
					<label className={styles.label} htmlFor={id}>
						{label}
					</label>
				) : null}
				{statusMessage && status ? (
					<Alert variant={status}>{statusMessage}</Alert>
				) : null}
			</div>
		);
	}

	return (
		<textarea
			autoFocus={autoFocus}
			className={clsx(styles.textarea, className)}
			defaultValue={defaultValue}
			disabled={disabled}
			id={id}
			name={name}
			onChange={handleChange}
			placeholder={placeholder}
			rows={rows}
			value={value}
		/>
	);
}
