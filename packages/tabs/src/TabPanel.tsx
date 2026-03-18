import clsx, { type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./Tabs.module.scss";
import { useTabs } from "./TabsContext";

export type TabPanelProps = Omit<ComponentPropsWithoutRef<"div">, "role" | "className" | "id"> & {
	className?: ClassValue;
	value: string;
};

export function TabPanel({ className, value, ...rest }: TabPanelProps) {
	const { activeValue, baseId } = useTabs();
	const isActive = activeValue === value;

	if (!isActive) {
		return null;
	}

	return (
		<div
			role="tabpanel"
			id={`${baseId}-panel-${value}`}
			aria-labelledby={`${baseId}-tab-${value}`}
			className={clsx(styles.tabPanel, className)}
			{...rest}
		/>
	);
}
