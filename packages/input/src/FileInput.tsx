import { StatusMessage } from "@bezny/feedback";
import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, type ComponentPropsWithoutRef, useId } from "react";
import styles from "./FileInput.module.scss";

type ValidationStatus = "error" | "warning" | "success";

type NativeInputProps = Omit<
	ComponentPropsWithoutRef<"input">,
	"onChange" | "className" | "type" | "value" | "defaultValue"
>;

export type FileInputProps = NativeInputProps & {
	className?: ClassValue;
	label?: string;
	onChange?: (files: FileList | null) => void;
	status?: ValidationStatus;
	statusMessage?: string;
};

const statusClassMap: Record<ValidationStatus, string> = {
	error: styles.statusError,
	warning: styles.statusWarning,
	success: styles.statusSuccess,
};

export function FileInput({ className, label, onChange, status, statusMessage, ...rest }: FileInputProps) {
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
					className={clsx(styles.input, status && statusClassMap[status])}
					id={id}
					onChange={handleChange}
					type="file"
				/>
				<StatusMessage message={statusMessage} status={status} />
			</div>
		);
	}

	return <input {...rest} className={clsx(styles.input, className)} id={id} onChange={handleChange} type="file" />;
}
