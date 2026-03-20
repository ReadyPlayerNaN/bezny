import clsx, { type ClassValue } from "clsx";
import { type ComponentPropsWithoutRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ToastList.module.scss";

type HorizontalPosition = "left" | "center" | "right";
type VerticalPosition = "top" | "center" | "bottom";

export type ToastListProps = Omit<ComponentPropsWithoutRef<"div">, "className"> & {
	className?: ClassValue;
	horizontal?: HorizontalPosition;
	vertical?: VerticalPosition;
};

const horizontalClassMap: Record<HorizontalPosition, string> = {
	left: styles.left,
	center: styles.hCenter,
	right: styles.right,
};

const verticalClassMap: Record<VerticalPosition, string> = {
	top: styles.top,
	center: styles.vCenter,
	bottom: styles.bottom,
};

export function ToastList({ children, className, horizontal = "right", vertical = "bottom", ...rest }: ToastListProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return createPortal(
		<div
			aria-live="polite"
			className={clsx(styles.toastList, horizontalClassMap[horizontal], verticalClassMap[vertical], className)}
			{...rest}
		>
			{children}
		</div>,
		document.body,
	);
}
