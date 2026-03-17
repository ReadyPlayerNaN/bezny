import { createPolymorphic } from "@bezny/core";
import clsx, { type ClassValue } from "clsx";
import styles from "./Stack.module.scss";

const GRID_UNIT = 4;

export type StackOwnProps = {
	className?: ClassValue;
	direction?: "vertical" | "horizontal";
	gap?: number;
};

export const Stack = createPolymorphic<"div", StackOwnProps>(
	"div",
	(Tag, { className, direction = "vertical", gap }, { className: _, direction: _d, gap: _g, ...rest }) => (
		<Tag
			className={clsx(styles.stack, direction === "horizontal" ? styles.horizontal : styles.vertical, className)}
			style={gap ? { gap: `${gap * GRID_UNIT}px` } : undefined}
			{...rest}
		/>
	),
);
