import clsx, { type ClassValue } from "clsx";
import { type ComponentPropsWithoutRef, type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Overlay.module.scss";

export type OverlayProps = Omit<ComponentPropsWithoutRef<"div">, "className" | "children"> & {
	children?: ReactNode | ((visible: boolean) => ReactNode);
	className?: ClassValue;
	open: boolean;
};

export function Overlay({ children, className, open, ...rest }: OverlayProps) {
	const overlayRef = useRef<HTMLDivElement>(null);
	const [mounted, setMounted] = useState(false);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (open) {
			setMounted(true);
		} else {
			setVisible(false);
			const overlay = overlayRef.current;
			if (overlay) {
				const handleEnd = () => setMounted(false);
				overlay.addEventListener("transitionend", handleEnd, { once: true });
				return () => {
					overlay.removeEventListener("transitionend", handleEnd);
					setMounted(false);
				};
			}
			setMounted(false);
		}
	}, [open]);

	useEffect(() => {
		if (mounted && open) {
			requestAnimationFrame(() => setVisible(true));
		}
	}, [mounted, open]);

	if (!mounted) {
		return null;
	}

	return createPortal(
		<div ref={overlayRef} className={clsx(styles.overlay, visible && styles.visible, className)} {...rest}>
			{typeof children === "function" ? children(visible) : children}
		</div>,
		document.body,
	);
}
