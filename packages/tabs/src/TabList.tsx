import clsx, { type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./Tabs.module.scss";

export type TabListProps = Omit<ComponentPropsWithoutRef<"div">, "role" | "className"> & {
	className?: ClassValue;
};

export function TabList({ className, ...rest }: TabListProps) {
	return <div role="tablist" className={clsx(styles.tabList, className)} {...rest} />;
}
