import clsx, { type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef, KeyboardEvent } from "react";
import styles from "./Tabs.module.scss";

export type TabListProps = Omit<ComponentPropsWithoutRef<"div">, "role" | "className"> & {
	className?: ClassValue;
};

function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
	const list = event.currentTarget;
	const tabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'));
	const current = tabs.indexOf(document.activeElement as HTMLElement);
	if (current === -1) {
		return;
	}

	let next = -1;
	if (event.key === "ArrowRight") {
		next = (current + 1) % tabs.length;
	} else if (event.key === "ArrowLeft") {
		next = (current - 1 + tabs.length) % tabs.length;
	} else if (event.key === "Home") {
		next = 0;
	} else if (event.key === "End") {
		next = tabs.length - 1;
	}

	if (next !== -1) {
		event.preventDefault();
		tabs[next].focus();
		tabs[next].click();
	}
}

export function TabList({ className, ...rest }: TabListProps) {
	return <div role="tablist" className={clsx(styles.tabList, className)} onKeyDown={handleKeyDown} {...rest} />;
}
