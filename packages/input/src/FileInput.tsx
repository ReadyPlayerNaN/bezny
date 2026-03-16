import { Alert } from "@bezny/alert";
import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, type ComponentPropsWithoutRef, useId } from "react";
import styles from "./FileInput.module.scss";

type ValidationStatus = "error" | "warning" | "success";

type NativeInputProps = Omit<ComponentPropsWithoutRef<"input">, "onChange" | "className" | "type" | "value" | "defaultValue">;

export type FileInputProps = NativeInputProps & {
	className?: ClassValue;
	label?: string;
	onChange?: (files: FileList | null) => void;
	status?: ValidationStatus;
	statusMessage?: string;
};

export function FileInput({
	className,
	label,
	onChange,
	status,
	statusMessage,
	...rest
}: FileInputProps) {
	const id = useId();

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		onChange?.(event.target.files);
	}

	if (label || status || statusMessage) {
		return (
			<div className={clsx(styles.wrapper, className)}>
				{label ? (
					<label className={styles.label} htmlFor={id}>
						{label}
					</label>
				) : null}
				<input
					{...rest}
					className={clsx(styles.input, {
						[styles.statusError]: status === "error",
						[styles.statusWarning]: status === "warning",
						[styles.statusSuccess]: status === "success",
					})}
					id={id}
					onChange={handleChange}
					type="file"
				/>
				{statusMessage && status ? (
					<Alert variant={status}>{statusMessage}</Alert>
				) : null}
			</div>
		);
	}

	return (
		<input
			{...rest}
			className={clsx(styles.input, className)}
			id={id}
			onChange={handleChange}
			type="file"
		/>
	);
}
