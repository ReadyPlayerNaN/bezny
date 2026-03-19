import { StatusMessage } from "@bezny/feedback";
import clsx, { type ClassValue } from "clsx";
import { type KeyboardEvent, useId, useState } from "react";
import styles from "./TagListInput.module.scss";

type ValidationStatus = "error" | "warning" | "success";

export type TagListInputTag = {
	label: string;
	value: string;
};

export type TagListInputProps = {
	className?: ClassValue;
	disabled?: boolean;
	label?: string;
	name?: string;
	onChange: (values: TagListInputTag[]) => void;
	placeholder?: string;
	status?: ValidationStatus;
	statusMessage?: string;
	values: TagListInputTag[];
};

export function TagListInput({
	className,
	disabled,
	label,
	name,
	onChange,
	placeholder = "Add item...",
	status,
	statusMessage,
	values,
}: TagListInputProps) {
	const id = useId();
	const statusId = useId();
	const [inputValue, setInputValue] = useState("");

	function addTag() {
		const trimmed = inputValue.trim();
		if (!trimmed) {
			return;
		}
		if (values.some((tag) => tag.value === trimmed)) {
			return;
		}
		onChange([...values, { label: trimmed, value: trimmed }]);
		setInputValue("");
	}

	function removeTag(value: string) {
		onChange(values.filter((tag) => tag.value !== value));
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Enter") {
			event.preventDefault();
			addTag();
		}
	}

	return (
		<div className={clsx(styles.wrapper, className)}>
			{label ? (
				<label className={styles.label} htmlFor={id}>
					{label}
				</label>
			) : null}
			{values.length > 0 ? (
				<div className={styles.tagList}>
					{values.map((tag) => (
						<span className={styles.tag} key={tag.value}>
							{tag.label}
							<button
								aria-label={`Remove ${tag.label}`}
								className={styles.removeButton}
								disabled={disabled}
								onClick={() => removeTag(tag.value)}
								type="button"
							>
								×
							</button>
						</span>
					))}
				</div>
			) : null}
			<div className={styles.inputRow}>
				<input
					aria-describedby={statusMessage ? statusId : undefined}
					aria-invalid={status === "error" || undefined}
					className={clsx(styles.input, {
						[styles.statusError]: status === "error",
						[styles.statusWarning]: status === "warning",
						[styles.statusSuccess]: status === "success",
					})}
					disabled={disabled}
					id={id}
					name={name}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					type="text"
					value={inputValue}
				/>
				<button className={styles.addButton} disabled={disabled} onClick={addTag} type="button">
					Add
				</button>
			</div>
			<StatusMessage id={statusId} message={statusMessage} status={status} />
		</div>
	);
}
