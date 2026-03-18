import clsx, { type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./Tabs.module.scss";
import { useTabs } from "./TabsContext";

export type TabProps = Omit<ComponentPropsWithoutRef<"button">, "role" | "className" | "id"> & {
	className?: ClassValue;
	value: string;
};

export function Tab({ className, value, ...rest }: TabProps) {
	const { activeValue, baseId, onSelect } = useTabs();
	const isActive = activeValue === value;

	return (
		<button
			role="tab"
			type="button"
			id={`${baseId}-tab-${value}`}
			aria-selected={isActive}
			aria-controls={`${baseId}-panel-${value}`}
			tabIndex={isActive ? 0 : -1}
			className={clsx(styles.tab, isActive && styles.tabActive, className)}
			onClick={() => onSelect(value)}
			{...rest}
		/>
	);
}
