import { createPolymorphic } from "@bezny/core";
import clsx, { type ClassValue } from "clsx";
import styles from "./Container.module.scss";

type ContainerMaxWidth = "sm" | "md" | "lg" | "xl";

export type ContainerOwnProps = {
	className?: ClassValue;
	maxWidth?: ContainerMaxWidth;
};

const maxWidthClassMap: Record<ContainerMaxWidth, string> = {
	sm: styles.sm,
	md: styles.md,
	lg: styles.lg,
	xl: styles.xl,
};

export const Container = createPolymorphic<"div", ContainerOwnProps>(
	"div",
	(Tag, { className, maxWidth }, { className: _, maxWidth: _mw, ...rest }) => (
		<Tag className={clsx(styles.container, maxWidth && maxWidthClassMap[maxWidth], className)} {...rest} />
	),
);
