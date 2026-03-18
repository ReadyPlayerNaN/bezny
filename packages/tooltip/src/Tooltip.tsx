import clsx, { type ClassValue } from "clsx";
import { type ReactNode, type RefObject, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Tooltip.module.scss";

export type TooltipPlacement = "top" | "bottom";

export type TooltipProps = {
	anchorRef: RefObject<HTMLElement | null>;
	children?: ReactNode;
	className?: ClassValue;
	id?: string;
	open: boolean;
	placement?: TooltipPlacement;
};

export function Tooltip({ anchorRef, children, className, id, open, placement = "top" }: TooltipProps) {
	const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

	const updatePosition = useCallback(() => {
		const anchor = anchorRef.current;
		if (!anchor) {
			return;
		}
		const rect = anchor.getBoundingClientRect();
		const left = rect.left + rect.width / 2 + window.scrollX;
		const top = placement === "top" ? rect.top + window.scrollY : rect.bottom + window.scrollY;
		setPosition({ left: left, top: top });
	}, [anchorRef, placement]);

	useLayoutEffect(() => {
		if (!open) {
			return;
		}
		updatePosition();
	}, [open, updatePosition]);

	useEffect(() => {
		if (!open) {
			return;
		}
		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);
		return () => {
			window.removeEventListener("scroll", updatePosition, true);
			window.removeEventListener("resize", updatePosition);
		};
	}, [open, updatePosition]);

	if (!open) {
		return null;
	}

	return createPortal(
		<div
			className={clsx(styles.tooltip, styles[placement], className)}
			id={id}
			role="tooltip"
			style={{ left: position.left, top: position.top }}
		>
			{children}
		</div>,
		document.body,
	);
}
