import { StatusMessage } from "@bezny/feedback";
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

const statusClassMap: Record<ValidationStatus, string> = {
	error: styles.statusError,
	warning: styles.statusWarning,
	success: styles.statusSuccess,
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
	const statusId = useId();
	const useWrapper = [label, status, statusMessage].some((v) => v !== undefined && v !== "");

	function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
		onChange?.(event.target.value);
	}

	if (useWrapper) {
		return (
			<div className={clsx(styles.wrapper, className)}>
				<textarea
					aria-describedby={statusMessage ? statusId : undefined}
					aria-invalid={status === "error" || undefined}
					autoFocus={autoFocus}
					className={clsx(styles.textarea, status && statusClassMap[status])}
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
				<StatusMessage className={styles.statusMessage} id={statusId} message={statusMessage} status={status} />
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
