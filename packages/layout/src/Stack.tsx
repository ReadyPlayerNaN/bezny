import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./Stack.module.scss";

const GRID_UNIT = 4;

export type StackProps = {
	children?: ReactNode;
	className?: ClassValue;
	direction?: "vertical" | "horizontal";
	gap?: number;
};

export function Stack({ children, className, direction = "vertical", gap }: StackProps) {
	const directionClass = direction === "horizontal" ? styles.horizontal : styles.vertical;

	return (
		<div
			className={clsx(styles.stack, directionClass, className)}
			style={gap ? { gap: `${gap * GRID_UNIT}px` } : undefined}
		>
			{children}
		</div>
	);
}
