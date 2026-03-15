import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./Container.module.scss";

type ContainerMaxWidth = "sm" | "md" | "lg" | "xl";

export type ContainerProps = {
	children?: ReactNode;
	className?: ClassValue;
	maxWidth?: ContainerMaxWidth;
};

const maxWidthClassMap: Record<ContainerMaxWidth, string> = {
	sm: styles.sm,
	md: styles.md,
	lg: styles.lg,
	xl: styles.xl,
};

export function Container({ children, className, maxWidth }: ContainerProps) {
	return <div className={clsx(styles.container, maxWidth && maxWidthClassMap[maxWidth], className)}>{children}</div>;
}
