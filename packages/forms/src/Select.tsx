import { StatusMessage } from "@bezny/feedback";
import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, type ComponentPropsWithoutRef, type ReactNode, useId } from "react";
import styles from "./Select.module.scss";

type ValidationStatus = "error" | "warning" | "success";

type NativeSelectProps = Omit<ComponentPropsWithoutRef<"select">, "onChange" | "className">;

export type SelectProps = NativeSelectProps & {
	children?: ReactNode;
	className?: ClassValue;
	label?: string;
	onChange?: (value: string) => void;
	status?: ValidationStatus;
	statusMessage?: string;
};

const statusClassMap: Record<ValidationStatus, string> = {
	error: styles.statusError,
	warning: styles.statusWarning,
	success: styles.statusSuccess,
};

export function Select({
	autoFocus,
	children,
	className,
	defaultValue,
	disabled,
	label,
	name,
	onChange,
	status,
	statusMessage,
	value,
	...rest
}: SelectProps) {
	const id = useId();
	const statusId = useId();
	const useWrapper = [label, status, statusMessage].some((v) => v !== undefined && v !== "");

	function handleChange(event: ChangeEvent<HTMLSelectElement>) {
		onChange?.(event.target.value);
	}

	if (useWrapper) {
		return (
			<div className={clsx(styles.wrapper, className)}>
				<select
					{...rest}
					aria-describedby={statusMessage ? statusId : undefined}
					aria-invalid={status === "error" || undefined}
					autoFocus={autoFocus}
					className={clsx(styles.select, status && statusClassMap[status])}
					defaultValue={defaultValue}
					disabled={disabled}
					id={id}
					name={name}
					onChange={handleChange}
					value={value}
				>
					{label ? <option value="" disabled={true} hidden={true} /> : null}
					{children}
				</select>
				{label ? (
					<label
						className={clsx(styles.label, {
							[styles.floated]: value === undefined ? true : value !== "",
						})}
						htmlFor={id}
					>
						{label}
					</label>
				) : null}
				<StatusMessage className={styles.statusMessage} id={statusId} message={statusMessage} status={status} />
			</div>
		);
	}

	return (
		<select
			{...rest}
			autoFocus={autoFocus}
			className={clsx(styles.select, className)}
			defaultValue={defaultValue}
			disabled={disabled}
			id={id}
			name={name}
			onChange={handleChange}
			value={value}
		>
			{children}
		</select>
	);
}
