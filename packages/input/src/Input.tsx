import { Alert } from "@bezny/alert";
import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, type ComponentPropsWithoutRef, useId } from "react";
import styles from "./Input.module.scss";

type ValidationStatus = "error" | "warning" | "success";

type NativeInputProps = Omit<ComponentPropsWithoutRef<"input">, "onChange" | "className">;

export type InputProps = NativeInputProps & {
	className?: ClassValue;
	label?: string;
	onChange?: (value: string) => void;
	status?: ValidationStatus;
	statusMessage?: string;
};

export function Input({
	autoFocus,
	className,
	defaultValue,
	disabled,
	label,
	name,
	onChange,
	placeholder,
	status,
	statusMessage,
	type = "text",
	value,
	...rest
}: InputProps) {
	const id = useId();
	const useWrapper = Boolean(label || status || statusMessage);

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		onChange?.(event.target.value);
	}

	if (useWrapper) {
		return (
			<div className={clsx(styles.wrapper, className)}>
				<input
					{...rest}
					autoFocus={autoFocus}
					className={clsx(styles.input, {
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
					type={type}
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
		<input
			{...rest}
			autoFocus={autoFocus}
			className={clsx(styles.input, className)}
			defaultValue={defaultValue}
			disabled={disabled}
			id={id}
			name={name}
			onChange={handleChange}
			placeholder={placeholder}
			type={type}
			value={value}
		/>
	);
}
