import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import { useButtonGroup } from "./ButtonGroupContext";
import styles from "./ButtonGroupOption.module.scss";

export type ButtonGroupOptionProps = {
	children: ReactNode;
	className?: ClassValue;
	disabled?: boolean;
	value: string;
};

export function ButtonGroupOption({ children, className, disabled, value }: ButtonGroupOptionProps) {
	const group = useButtonGroup();
	const isDisabled = disabled ?? group?.disabled;
	const isSelected = group?.value === value;

	const handleClick = () => {
		if (!isDisabled) {
			group?.onChange?.(value);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		const target = e.currentTarget;
		let sibling: Element | null = null;

		if (e.key === "ArrowRight" || e.key === "ArrowDown") {
			e.preventDefault();
			sibling = target.nextElementSibling ?? target.parentElement?.firstElementChild ?? null;
		} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
			e.preventDefault();
			sibling = target.previousElementSibling ?? target.parentElement?.lastElementChild ?? null;
		}

		if (sibling instanceof HTMLElement) {
			sibling.focus();
			sibling.click();
		}
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: button with role="radio" is intentional for custom ButtonGroup styling
		<button
			aria-checked={isSelected}
			className={clsx(styles.option, { [styles.selected]: isSelected, [styles.disabled]: isDisabled }, className)}
			disabled={isDisabled}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			role="radio"
			tabIndex={isSelected ? 0 : -1}
			type="button"
		>
			{children}
		</button>
	);
}
