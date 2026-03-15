import clsx, { type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import { createPortal } from "react-dom";
import styles from "./Overlay.module.scss";

export type OverlayProps = Omit<ComponentPropsWithoutRef<"div">, "className"> & {
	className?: ClassValue;
	open: boolean;
};

export function Overlay({ children, className, open, ...rest }: OverlayProps) {
	if (!open) {
		return null;
	}

	return createPortal(
		<div className={clsx(styles.overlay, className)} {...rest}>
			{children}
		</div>,
		document.body,
	);
}
