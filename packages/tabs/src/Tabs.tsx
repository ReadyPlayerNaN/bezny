import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import styles from "./Tabs.module.scss";
import { TabsContext } from "./TabsContext";

export type TabsOwnProps = {
	children?: ReactNode;
	className?: ClassValue;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	value?: string;
};

export function Tabs({ children, className, defaultValue = "", onValueChange, value: controlledValue }: TabsOwnProps) {
	const [internalValue, setInternalValue] = useState(defaultValue);
	const baseId = useId();
	const isControlled = controlledValue !== undefined;
	const activeValue = isControlled ? controlledValue : internalValue;
	const handleSelect = (val: string) => {
		if (!isControlled) {
			setInternalValue(val);
		}
		onValueChange?.(val);
	};

	return (
		<TabsContext value={{ activeValue: activeValue, baseId: baseId, onSelect: handleSelect }}>
			<div className={clsx(styles.tabs, className)}>{children}</div>
		</TabsContext>
	);
}
