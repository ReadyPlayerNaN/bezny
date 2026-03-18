import clsx, { type ClassValue } from "clsx";
import { type ReactNode, type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Popover.module.scss";

export type PopoverProps = {
	align?: "left" | "right";
	anchorRef: RefObject<HTMLElement | null>;
	children?: ReactNode;
	className?: ClassValue;
	onClose: () => void;
	open: boolean;
};

export function Popover({ align = "left", anchorRef, children, className, onClose, open }: PopoverProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

	const updatePosition = useCallback(() => {
		const anchor = anchorRef.current;
		if (!anchor) {
			return;
		}
		const rect = anchor.getBoundingClientRect();
		const panel = panelRef.current;
		const panelWidth = panel ? panel.offsetWidth : 0;
		const left = align === "left" ? rect.left : rect.right - panelWidth;
		setPosition({
			left: left + window.scrollX,
			top: rect.bottom + window.scrollY,
		});
	}, [anchorRef, align]);

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

	useEffect(() => {
		if (!open) {
			return;
		}
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open, onClose]);

	useEffect(() => {
		if (!open) {
			return;
		}
		const handleClick = (event: MouseEvent) => {
			const { target } = event;
			if (!(target instanceof Node)) {
				return;
			}
			if (anchorRef.current?.contains(target)) {
				return;
			}
			if (panelRef.current?.contains(target)) {
				return;
			}
			onClose();
		};
		document.addEventListener("mousedown", handleClick);
		return () => {
			document.removeEventListener("mousedown", handleClick);
		};
	}, [open, onClose, anchorRef]);

	if (!open) {
		return null;
	}

	return createPortal(
		<div ref={panelRef} className={clsx(styles.popover, className)} style={{ left: position.left, top: position.top }}>
			{children}
		</div>,
		document.body,
	);
}
