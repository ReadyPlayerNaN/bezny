import { StatusMessage } from "@bezny/feedback";
import clsx, { type ClassValue } from "clsx";
import { type ChangeEvent, type ComponentPropsWithoutRef, useId } from "react";
import styles from "./SelectInput.module.scss";

type ValidationStatus = "error" | "warning" | "success";

type NativeSelectProps = Omit<ComponentPropsWithoutRef<"select">, "onChange" | "className">;

export type SelectInputOption = {
	label: string;
	value: string;
};

export type SelectInputProps = NativeSelectProps & {
	className?: ClassValue;
	label?: string;
	onChange?: (value: string) => void;
	options: SelectInputOption[];
	placeholder?: string;
	status?: ValidationStatus;
	statusMessage?: string;
};

export function SelectInput({
	className,
	defaultValue,
	disabled,
	label,
	name,
	onChange,
	options,
	placeholder,
	status,
	statusMessage,
	value,
	...rest
}: SelectInputProps) {
	const id = useId();
	const statusId = useId();
	const useWrapper = Boolean(label || status || statusMessage);

	function handleChange(event: ChangeEvent<HTMLSelectElement>) {
		onChange?.(event.target.value);
	}

	const selectOptions = (
		<>
			{placeholder ? (
				<option value="" disabled={true} hidden={true}>
					{placeholder}
				</option>
			) : null}
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</>
	);

	if (useWrapper) {
		return (
			<div className={clsx(styles.wrapper, className)}>
				<select
					{...rest}
					aria-describedby={statusMessage ? statusId : undefined}
					aria-invalid={status === "error" || undefined}
					className={clsx(styles.select, {
						[styles.statusError]: status === "error",
						[styles.statusWarning]: status === "warning",
						[styles.statusSuccess]: status === "success",
						[styles.hasLabel]: Boolean(label),
					})}
					defaultValue={defaultValue ?? (placeholder ? "" : undefined)}
					disabled={disabled}
					id={id}
					name={name}
					onChange={handleChange}
					value={value}
				>
					{selectOptions}
				</select>
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
		<select
			{...rest}
			className={clsx(styles.select, className)}
			defaultValue={defaultValue ?? (placeholder ? "" : undefined)}
			disabled={disabled}
			id={id}
			name={name}
			onChange={handleChange}
			value={value}
		>
			{selectOptions}
		</select>
	);
}
