import clsx, { type ClassValue } from "clsx";
import { type ComponentPropsWithoutRef, type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Overlay.module.scss";

export type OverlayProps = Omit<ComponentPropsWithoutRef<"div">, "className" | "children"> & {
	children?: ReactNode | ((open: boolean) => ReactNode);
	className?: ClassValue;
	open: boolean;
};

export function Overlay({ children, className, open, ...rest }: OverlayProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return createPortal(
		<div
			data-scroll-lock={open ? "" : undefined}
			className={clsx(styles.overlay, open && styles.open, className)}
			{...rest}
		>
			{typeof children === "function" ? children(open) : children}
		</div>,
		document.body,
	);
}
